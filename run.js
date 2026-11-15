import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

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

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}

async function main() {
  const backendPort = await findAvailablePort(parseInt(process.env.PORT || '5000', 10));
  const frontendPort = await findAvailablePort(parseInt(process.env.CLIENT_PORT || '3000', 10));

  function startBackend() {
    if (isShuttingDown) return;
    console.log(`[1/2] Starting Backend Server (Port ${backendPort})...`);
    serverProcess = spawn(nodeCmd, ['server.js'], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: String(backendPort)
      }
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
    console.log(`[2/2] Starting Frontend Web Application (Port ${frontendPort})...`);
    clientProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: path.join(__dirname, 'client'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: String(frontendPort),
        VITE_BACKEND_PORT: String(backendPort)
      }
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

  setTimeout(() => {
    console.log('\n================================================================');
    console.log(' [SUCCESS] Local servers initialized and ready!');
    console.log(` -> Web Application: http://localhost:${frontendPort}`);
    console.log(` -> Backend API:     http://localhost:${backendPort}`);
    console.log('================================================================\n');
  }, 3000);
}

main().catch(console.error);

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
