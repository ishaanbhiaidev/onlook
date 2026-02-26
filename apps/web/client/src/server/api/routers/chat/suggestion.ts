import { initModel, SUGGESTION_SYSTEM_PROMPT } from '@onlook/ai';
import { conversations } from '@onlook/db';
import type { ChatSuggestion } from '@onlook/models';
import { LLMProvider, OPENROUTER_MODELS } from '@onlook/models';
import { ChatSuggestionsSchema } from '@onlook/models/chat';
import { convertToModelMessages, generateObject } from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const suggestionsRouter = createTRPCRouter({
    generate: protectedProcedure
        .input(z.object({
            conversationId: z.string(),
            messages: z.array(z.object({
                role: z.enum(['user', 'assistant', 'system']),
                content: z.string(),
            })),
        }))
        .mutation(async ({ ctx, input }) => {
            const { model, maxOutputTokens: defaultMaxTokens } = initModel({
                provider: LLMProvider.OPENROUTER,
                model: OPENROUTER_MODELS.OPEN_AI_GPT_5_NANO,
            });
            
            // Build conversation context
            const conversationContext = input.messages
                .map((m) => `${m.role}: ${m.content}`)
                .join('\n\n');
            
            const prompt = `${SUGGESTION_SYSTEM_PROMPT}

Conversation:
${conversationContext}

Based on our conversation, what should I work on next to improve this page? Provide 3 specific, actionable suggestions. These should be realistic and achievable. Return the suggestions as a JSON object with a 'suggestions' array containing objects with 'title' and 'prompt' fields. DO NOT include any other text.`;

            const { object } = await generateObject({
                model,
                schema: ChatSuggestionsSchema,
                prompt,
                maxOutputTokens: 10000,
            });
            const suggestions = object.suggestions satisfies ChatSuggestion[];
            try {
                await ctx.db.update(conversations).set({
                    suggestions,
                }).where(eq(conversations.id, input.conversationId));
            } catch (error) {
                console.error('Error updating conversation suggestions:', error);
            }
            return suggestions;
        }),
});
