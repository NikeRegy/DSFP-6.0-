const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const server = spawn('node', [path.join(__dirname, '..', 'server', 'index.js')], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '3001' }
});

const client = spawn(npmCmd, ['--prefix', path.join(__dirname, '..', 'client'), 'run', 'dev'], {
  stdio: 'inherit',
  shell: isWin
});

function shutdown() {
  server.kill();
  client.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

