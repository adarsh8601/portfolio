// Runs the API (with auto-restart) and the Vite dev server together.
import { spawn } from 'node:child_process';

const run = (cmd, args, name) => {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('exit', (code) => {
    console.log(`[${name}] exited (${code})`);
    process.exit(code ?? 0);
  });
  return p;
};
// Windows/macOS: watch only code folders, so writing data/*.json doesn't restart the API mid-request.
const watchArgs = ['win32', 'darwin'].includes(process.platform)
  ? ['--watch-path=server', '--watch-path=shared', '--watch-path=src/data']
  : ['--watch'];
const procs = [run('node', [...watchArgs, 'server/node.js'], 'api'), run('npx', ['vite'], 'web')];
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => procs.forEach((p) => p.kill(sig)));
