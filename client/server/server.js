import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(clientDir, '..');
const clientNodeModules = path.resolve(clientDir, 'node_modules');
const rootNodeModules = path.resolve(rootDir, 'node_modules');
const serverNodeModules = path.resolve(rootDir, 'server/node_modules');

console.log('[Render Startup Helper] Initializing from client/server directory...');
console.log('[Render Startup Helper] Client dir:', clientDir);
console.log('[Render Startup Helper] Root dir:', rootDir);

// 1. Ensure root node_modules exists so server/server.js can find express & cors
if (!fs.existsSync(rootNodeModules) && fs.existsSync(clientNodeModules)) {
  try {
    fs.symlinkSync(clientNodeModules, rootNodeModules, 'junction');
    console.log('[Render Startup Helper] Linked root node_modules successfully.');
  } catch (err) {
    console.warn('[Render Startup Helper] Root node_modules notice:', err.message);
  }
}

// 2. Ensure server/node_modules exists
if (!fs.existsSync(serverNodeModules) && fs.existsSync(clientNodeModules)) {
  try {
    fs.symlinkSync(clientNodeModules, serverNodeModules, 'junction');
    console.log('[Render Startup Helper] Linked server node_modules successfully.');
  } catch (err) {
    console.warn('[Render Startup Helper] Server node_modules notice:', err.message);
  }
}

// 3. Ensure client/dist exists
const clientDist = path.resolve(clientDir, 'dist');
if (!fs.existsSync(clientDist) || !fs.existsSync(path.resolve(clientDist, 'index.html'))) {
  try {
    console.log('[Render Startup Helper] Generating Vite frontend build...');
    execSync('npx vite build', { cwd: clientDir, stdio: 'inherit' });
    console.log('[Render Startup Helper] Frontend build ready.');
  } catch (err) {
    console.warn('[Render Startup Helper] Vite build notice:', err.message);
  }
}

// 4. Launch actual backend server
const rootServerPath = path.resolve(rootDir, 'server/server.js');
console.log('[Render Startup Helper] Resolving main server at:', rootServerPath);
await import(pathToFileURL(rootServerPath).href);
