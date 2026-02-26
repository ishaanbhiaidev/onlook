/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';

// Skip env validation in development mode to allow dev server to start
if (process.env.NODE_ENV === 'development' && !process.env.SKIP_ENV_VALIDATION) {
    process.env.SKIP_ENV_VALIDATION = 'true';
}

import './src/env';

const nextConfig: NextConfig = {
    devIndicators: false,
    ...(process.env.STANDALONE_BUILD === 'true' && { output: 'standalone' }),
    eslint: {
        // Don't run ESLint during builds - handle it separately in CI
        ignoreDuringBuilds: true,
    },
};

if (process.env.NODE_ENV === 'development') {
    nextConfig.outputFileTracingRoot = path.join(__dirname, '../../..');
}

const withNextIntl = createNextIntlPlugin({
    experimental: {
        createMessagesDeclaration: './messages/en.json'
    }
});
export default withNextIntl(nextConfig);
