import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load .env.local
const __dir = dirname(fileURLToPath(import.meta.url));
const envFile = join(__dir, '.env.local');
if (existsSync(envFile)) {
  readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && !k.startsWith('#')) process.env[k] = v.join('=');
  });
}

import handler from './api/recipe.js';
import scanHandler from './api/scan.js';

const MIME = {
  '.html': 'text/html',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.js':   'text/javascript',
  '.css':  'text/css',
};

const PORT = 3000;

createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/scan') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try { req.body = JSON.parse(body); } catch { req.body = {}; }
      const mockRes = {
        _code: 200,
        status(c) { this._code = c; return this; },
        json(data) {
          res.writeHead(this._code, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        },
      };
      await scanHandler(req, mockRes);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/recipe') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try { req.body = JSON.parse(body); } catch { req.body = {}; }
      const mockRes = {
        _code: 200,
        status(c) { this._code = c; return this; },
        json(data) {
          res.writeHead(this._code, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        },
      };
      await handler(req, mockRes);
    });
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = join(__dir, filePath);

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`\n  Fridge to Feast running at http://localhost:${PORT}\n`);
});
