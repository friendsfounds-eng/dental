import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = __dirname;
const rootDir = path.resolve(clientDir, '..');
const clientNodeModules = path.resolve(clientDir, 'node_modules');
const rootNodeModules = path.resolve(rootDir, 'node_modules');
const serverNodeModules = path.resolve(rootDir, 'server/node_modules');

console.log('[postinstall] Starting automated build & linking for Render deployment...');

// 1. Link root node_modules to client/node_modules if missing
if (!fs.existsSync(rootNodeModules) && fs.existsSync(clientNodeModules)) {
  try {
    console.log('[postinstall] Linking root node_modules -> client/node_modules');
    fs.symlinkSync(clientNodeModules, rootNodeModules, 'junction');
  } catch (e) {
    console.log('[postinstall] Root symlink notice:', e.message);
  }
}

// 2. Link server/node_modules to client/node_modules if missing
if (!fs.existsSync(serverNodeModules) && fs.existsSync(clientNodeModules)) {
  try {
    console.log('[postinstall] Linking server/node_modules -> client/node_modules');
    fs.symlinkSync(clientNodeModules, serverNodeModules, 'junction');
  } catch (e) {
    console.log('[postinstall] Server symlink notice:', e.message);
  }
}

// 3. Ensure Vite frontend is compiled into client/dist
const distPath = path.resolve(clientDir, 'dist');
if (!fs.existsSync(distPath) || !fs.existsSync(path.resolve(distPath, 'index.html'))) {
  try {
    console.log('[postinstall] Compiling frontend assets with Vite...');
    execSync('npx vite build', { cwd: clientDir, stdio: 'inherit' });
    console.log('[postinstall] Vite compilation successful!');
  } catch (e) {
    console.warn('[postinstall] Vite build warning:', e.message);
  }
} else {
  console.log('[postinstall] client/dist already exists.');
}
