import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   🦷 APEX DENTAL CLINIC ERP & ODONTOGRAM PRACTICE SYSTEM      ');
console.log('       WhatsApp Automation • AI Diagnostics • Human Charting    ');
console.log('================================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = 'node';

let isShuttingDown = false;
let serverProcess = null;
let clientProcess = null;

function startBackend() {
  if (isShuttingDown) return;
  console.log('[1/2] Starting Backend Server (Port 5000)...');
  serverProcess = spawn(nodeCmd, ['server.js'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.warn(`[Backend] Server exited (code ${code}). Auto-restarting in 1.5s...`);
      setTimeout(startBackend, 1500);
    }
  });
}

function startFrontend() {
  if (isShuttingDown) return;
  console.log('[2/2] Starting Frontend Web Application (Port 3000)...');
  clientProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit',
    shell: true
  });

  clientProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.warn(`[Frontend] Client exited (code ${code}). Auto-restarting in 2s...`);
      setTimeout(startFrontend, 2000);
    }
  });
}

// Start both services
startBackend();
startFrontend();

// Automatically open browser after 3 seconds
setTimeout(() => {
  const url = 'http://localhost:3000';
  console.log(`\n🚀 Dental ERP ready at: ${url}`);
}, 3000);

console.log('\n[SUCCESS] Local servers initialized.');
console.log('-> Web App: http://localhost:3000');
console.log('-> API & Production App: http://localhost:5000');
console.log('Press Ctrl + C in this terminal to terminate.\n');

const cleanExit = () => {
  isShuttingDown = true;
  try {
    if (serverProcess) serverProcess.kill();
    if (clientProcess) clientProcess.kill();
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
