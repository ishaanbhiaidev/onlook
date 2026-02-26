import { spawn } from 'child_process';

console.log('[v0] Starting bun install to fix frozen lockfile...');

const bunProcess = spawn('bun', ['install'], {
  cwd: '/vercel/share/v0-project',
  stdio: 'inherit'
});

bunProcess.on('close', (code) => {
  if (code === 0) {
    console.log('[v0] ✓ Lockfile regenerated successfully!');
    console.log('[v0] You can now run: bun --filter @onlook/web dev');
  } else {
    console.error(`[v0] ✗ Error during bun install (exit code: ${code})`);
    process.exit(code);
  }
});
