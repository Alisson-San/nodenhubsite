// Read-only local preview of the generated Vercel fetch handler (not a Vercel emulator).
// npm run build && node --env-file=.env scripts/qa/preview-production.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve('.vercel/output/static');
const { default: app } = await import(pathToFileURL(resolve('.vercel/output/functions/_render.func/dist/server/entry.mjs')));
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const mobileRule = config.redirects.find(rule => rule.source === '/');
const mobilePattern = new RegExp(mobileRule.has[0].value);
const types = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.html': 'text/html' };
createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const url = new URL(req.url, 'http://127.0.0.1:4323');
    if (url.pathname === '/' && mobilePattern.test(req.headers['user-agent'] ?? '')) {
      res.writeHead(307, { location: mobileRule.destination + url.search }); return res.end();
    }
    const file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file.startsWith(root + '/')) {
      const info = await stat(file).catch(() => null);
      if (info?.isFile()) {
        res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
        return res.end(req.method === 'HEAD' ? undefined : await readFile(file));
      }
    }
    const response = await app.fetch(new Request(url, { method: req.method, headers: req.headers }));
    res.writeHead(response.status, { ...Object.fromEntries(response.headers), 'cache-control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500); res.end('Preview failed; inspect build and configuration.');
  }
}).listen(4323, '127.0.0.1', () => console.log('Production build preview: http://127.0.0.1:4323 (GET/HEAD only)'));
