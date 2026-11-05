import type { APIRoute } from "astro";
import { createSupabaseRequestClient } from "../../../../lib/supabase/request";
import { validateImageUpload } from "../../../../lib/catalog/media";
import { SHOWCASE_BUCKET } from "../../../../lib/showcase/types";

export const prerender = false;

const MAX = 8 * 1024 * 1024;
const respond = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** Envio de imagem da vitrine (PNG, JPEG ou WebP até 8 MB, conteúdo conferido). */
export const POST: APIRoute = async (context) => {
	if (!context.locals.user || !context.locals.isAdmin) return respond(403, { error: "Acesso negado." });
	if (context.request.headers.get("origin") !== new URL(context.request.url).origin) return respond(403, { error: "Origem inválida." });
	if (Number(context.request.headers.get("content-length")) > MAX + 1024 * 1024) return respond(413, { error: "Envie uma imagem de até 8 MB." });
	try {
		const form = await context.request.formData();
		const file = form.get("file");
		if (!(file instanceof File)) return respond(400, { error: "Escolha uma imagem." });
		if (file.size > MAX) return respond(413, { error: "Envie uma imagem de até 8 MB." });
		const bytes = new Uint8Array(await file.arrayBuffer());
		const invalid = validateImageUpload(bytes, file.type);
		if (invalid) return respond(400, { error: invalid });
		const ext = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as Record<string, string>)[file.type];
		const path = `${crypto.randomUUID()}.${ext}`;
		const client = createSupabaseRequestClient({ request: context.request, cookies: context.cookies });
		const result = await client.storage.from(SHOWCASE_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
		if (result.error) return respond(503, { error: "Não foi possível enviar. Confirme se a vitrine já foi ativada no banco." });
		return respond(201, { path, url: client.storage.from(SHOWCASE_BUCKET).getPublicUrl(path).data.publicUrl });
	} catch {
		return respond(400, { error: "Não foi possível processar o envio." });
	}
};
