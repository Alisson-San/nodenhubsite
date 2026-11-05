import type { APIRoute } from "astro";
import type { Json } from "../../../../types/database.types";
import { createSupabaseRequestClient } from "../../../../lib/supabase/request";
import { validateHomeContent } from "../../../../lib/site/homeContent";
import { HOME_DRAFT_KEY } from "../../../../lib/site/homeView";
import { deleteSetting, loadPrivateSetting, saveSetting } from "../../../../lib/site/settingsRepository";
import { json, validOrigin } from "./drafts";

export const prerender = false;

/**
 * Rascunho e publicação dos textos da página inicial.
 * Rascunho: site_settings "site.home_draft" (privado).
 * Publicação: copia para site.identity.home (público) e remove o rascunho.
 */
export const POST: APIRoute = async (context) => {
	if (!context.locals.user || !context.locals.isAdmin) return json({ error: "Acesso negado." }, 403);
	if (!validOrigin(context.request)) return json({ error: "Origem inválida." }, 403);

	let body: { action?: string; content?: unknown };
	try {
		body = await context.request.json();
	} catch {
		return json({ error: "JSON inválido." }, 400);
	}

	const client = createSupabaseRequestClient(context);
	const userId = context.locals.user.id;

	try {
		if (body.action === "discard") {
			await deleteSetting(client, HOME_DRAFT_KEY);
			return json({ ok: true });
		}

		if (body.action === "save") {
			const content = validateHomeContent(body.content);
			if (!content) return json({ error: "Revise os textos: campos vazios, muito longos ou destaques fora do limite (1 a 6 itens de até 100 caracteres)." }, 422);
			await saveSetting(client, HOME_DRAFT_KEY, content as unknown as Json, {
				isPublic: false,
				description: "Rascunho dos textos da página inicial (edição no site).",
				userId,
			});
			return json({ ok: true });
		}

		if (body.action === "publish") {
			const draft = validateHomeContent(await loadPrivateSetting(client, HOME_DRAFT_KEY));
			if (!draft) return json({ error: "Salve o rascunho antes de publicar." }, 404);
			const identity = await loadPrivateSetting(client, "site.identity");
			const merged = {
				...(identity && typeof identity === "object" && !Array.isArray(identity) ? identity : {}),
				home: draft,
			};
			await saveSetting(client, "site.identity", merged as unknown as Json, {
				isPublic: true,
				description: "Identidade pública do site.",
				userId,
			});
			await deleteSetting(client, HOME_DRAFT_KEY);
			return json({ published: true });
		}

		return json({ error: "Ação inválida." }, 400);
	} catch (error) {
		console.error("[Noden] Falha na edição da inicial.", error);
		const code = (error as { code?: string })?.code;
		if (code === "42501") return json({ error: "Acesso negado." }, 403);
		return json({ error: "Não foi possível concluir. Suas alterações continuam na tela." }, 500);
	}
};
