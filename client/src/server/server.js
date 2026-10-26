import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = __dirname;
const clientDir = path.resolve(srcDir, '..');
const rootDir = path.resolve(clientDir, '..');
const clientNodeModules = path.resolve(clientDir, 'node_modules');
const rootNodeModules = path.resolve(rootDir, 'node_modules');
const serverNodeModules = path.resolve(rootDir, 'server/node_modules');

console.log('[Render Startup Helper] Initializing from client/src/server directory...');

if (!fs.existsSync(rootNodeModules) && fs.existsSync(clientNodeModules)) {
  try {
    fs.symlinkSync(clientNodeModules, rootNodeModules, 'junction');
  } catch (err) {}
}

if (!fs.existsSync(serverNodeModules) && fs.existsSync(clientNodeModules)) {
  try {
    fs.symlinkSync(clientNodeModules, serverNodeModules, 'junction');
  } catch (err) {}
}

const clientDist = path.resolve(clientDir, 'dist');
if (!fs.existsSync(clientDist) || !fs.existsSync(path.resolve(clientDist, 'index.html'))) {
  try {
    execSync('npx vite build', { cwd: clientDir, stdio: 'inherit' });
  } catch (err) {}
}

const rootServerPath = path.resolve(rootDir, 'server/server.js');
console.log('[Render Startup Helper] Resolving main server at:', rootServerPath);
await import(pathToFileURL(rootServerPath).href);
