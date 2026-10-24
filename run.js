import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   🦷 APEX DENTAL CLINIC ERP & ODONTOGRAM PRACTICE SYSTEM      ');
console.log('       WhatsApp Automation • AI Diagnostics • Human Charting    ');
console.log('================================================================');
console.log('[1/2] Starting Backend Server (Port 5000)...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = 'node';

// Start Server in server directory
const serverProcess = spawn(nodeCmd, ['server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Start Client Vite Dev Server in client directory
console.log('[2/2] Starting Frontend Web Application (Port 3000)...');
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

// Automatically open browser after 3 seconds
setTimeout(() => {
  const url = 'http://localhost:3000';
  console.log(`\n🚀 Opening Dental ERP in your browser: ${url}`);
  if (isWindows) {
    exec(`start ${url}`);
  } else if (process.platform === 'darwin') {
    exec(`open ${url}`);
  } else {
    exec(`xdg-open ${url}`);
  }
}, 3000);

console.log('\n[SUCCESS] Local servers initialized.');
console.log('-> Web App: http://localhost:3000');
console.log('-> API & Production App: http://localhost:5000');
console.log('Press Ctrl + C in this terminal to terminate.\n');

const cleanExit = () => {
  try {
    serverProcess.kill();
    clientProcess.kill();
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
