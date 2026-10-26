import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Render startup helper: forwards execution if Render start command was set to `node client/src/server/server.js`
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootServerPath = path.resolve(__dirname, '../../../server/server.js');

console.log('[Render Startup Helper] Resolving main server at:', rootServerPath);
await import(pathToFileURL(rootServerPath).href);
