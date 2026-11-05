// Serve localmente o build de produção da Vercel (.vercel/output): arquivos
// estáticos + a função do site. O `astro preview` não funciona com o adaptador
// da Vercel. Uso: npm run build && npm run preview  →  http://localhost:4321
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.vercel/output");
const port = Number(process.env.PORT || 4321);
const { default: handler } = await import(path.join(root, "functions/_render.func/.vercel/output/server/entry.mjs"));
const types = {
	".js": "text/javascript",
	".css": "text/css",
	".webp": "image/webp",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".woff2": "font/woff2",
	".ico": "image/x-icon",
	".webmanifest": "application/manifest+json",
};

http
	.createServer(async (req, res) => {
		const url = new URL(req.url ?? "/", `http://localhost:${port}`);
		const file = path.join(root, "static", path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ""));
		try {
			if (file.startsWith(path.join(root, "static")) && (await stat(file)).isFile()) {
				res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "cache-control": "public, max-age=31536000" });
				res.end(await readFile(file));
				return;
			}
		} catch {
			/* não é arquivo estático: segue para a função */
		}
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		const response = await handler.fetch(
			new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : Buffer.concat(chunks) }),
		);
		const headers = {};
		response.headers.forEach((value, key) => {
			headers[key] = key === "set-cookie" ? response.headers.getSetCookie() : value;
		});
		res.writeHead(response.status, headers);
		res.end(Buffer.from(await response.arrayBuffer()));
	})
	.listen(port, () => console.log(`Build de produção em http://localhost:${port}`));
