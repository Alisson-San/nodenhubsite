import type { APIRoute } from "astro";
import type { Json } from "../../../../types/database.types";
import { createSupabaseRequestClient } from "../../../../lib/supabase/request";
import { isServiceDivision } from "../../../../lib/admin/divisions";
import { discardCatalogDraft, getEditorSnapshot, publishCatalogDraft } from "../../../../lib/catalog/draftRepository";
import { validateCatalogDocument } from "../../../../lib/catalog/editorValidation";
import { validateEditorExtras } from "../../../../lib/site/editorExtrasValidation";
import { pageTextsToUpdate } from "../../../../lib/site/pageTexts";
import { DIVISION_CONTENT_KEY } from "../../../../lib/site/divisionContent";
import { loadPrivateSetting, saveSetting } from "../../../../lib/site/settingsRepository";
import { json, validOrigin, editorError } from "./drafts";

export const prerender = false;

/**
 * Publica o rascunho da divisão.
 * 1. Catálogo, cards e detalhes: função atômica do banco (catalog_editor_publish).
 * 2. Promessas e etapas (site_settings), quando o rascunho as contém.
 * 3. Textos da página (service_pages). Por último, porque altera a revisão
 *    de origem da divisão (gatilho catalog_touch_source).
 * 4. Remove o rascunho: a próxima edição parte da versão publicada.
 * Se 2 ou 3 falharem, o rascunho permanece e uma nova tentativa reaplica tudo.
 */
export const POST: APIRoute = async (context) => {
	if (!context.locals.user || !context.locals.isAdmin) return json({ error: "Acesso negado." }, 403);
	if (!validOrigin(context.request)) return json({ error: "Origem inválida." }, 403);
	try {
		let body;
		try {
			body = await context.request.json();
		} catch {
			return json({ error: "JSON inválido." }, 400);
		}
		if (!isServiceDivision(body?.division) || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 1) {
			return json({ error: "Revisão ou divisão inválida." }, 400);
		}
		const division = body.division;
		const client = createSupabaseRequestClient(context);
		const snapshot = await getEditorSnapshot(client, division);
		if (!snapshot.ready) return json({ ready: false, error: snapshot.message }, 503);
		if (!snapshot.draft) return json({ error: "Salve o rascunho primeiro." }, 404);
		if (snapshot.draft.revision !== body.expectedRevision || snapshot.draft.baseRevision !== snapshot.sourceRevision) {
			return json({ error: "Conflito: esta divisão foi alterada fora deste rascunho (outra aba ou o painel antigo). Copie o que precisar, descarte o rascunho e refaça as alterações." }, 409);
		}
		const document = snapshot.draft.document;
		const errors = { ...validateCatalogDocument(document), ...validateEditorExtras(document) };
		if (Object.keys(errors).length) return json({ error: "Revise os campos.", errors }, 422);

		const published = await publishCatalogDraft(client, division, body.expectedRevision);
		const userId = context.locals.user.id;

		if (document.extras) {
			try {
				const current = await loadPrivateSetting(client, DIVISION_CONTENT_KEY);
				const merged = { ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}), [division]: document.extras };
				await saveSetting(client, DIVISION_CONTENT_KEY, merged as unknown as Json, {
					isPublic: true,
					description: "Promessas e etapas das páginas de divisão (editadas no site).",
					userId,
				});
			} catch (error) {
				console.error("[Noden] Falha ao publicar promessas e etapas.", error);
				return json({ error: "Catálogo publicado, mas promessas/etapas não. Tente publicar de novo." }, 500);
			}
		}

		if (document.page) {
			const { error } = await client.from("service_pages").update(pageTextsToUpdate(document.page, userId)).eq("division", division);
			if (error) {
				console.error("[Noden] Falha ao publicar textos da página.", error);
				return json({ error: "Catálogo e promessas publicados, mas os textos da página não. Tente publicar de novo." }, 500);
			}
		}

		try {
			await discardCatalogDraft(client, division, published.revision);
		} catch (error) {
			// O conteúdo já está no ar; o rascunho residual pode ser descartado pelo editor.
			console.error("[Noden] Publicado, mas o rascunho não foi removido.", error);
			return json({ published: true, warning: "Publicado. Descarte o rascunho antigo antes de continuar editando." });
		}

		return json({ published: true });
	} catch (error) {
		return editorError(error);
	}
};
