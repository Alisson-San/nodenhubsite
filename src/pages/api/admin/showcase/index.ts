import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseRequestClient } from "../../../../lib/supabase/request";
import { isShowcaseMissing, showcaseToRow } from "../../../../lib/showcase/repository";
import { isShowcaseDivision, validateShowcaseItem } from "../../../../lib/showcase/types";
import { json, validOrigin } from "../editor/drafts";

export const prerender = false;

/**
 * Vitrine (projetos Data / setups Game). Ações:
 * - save: cria ou atualiza um item (publicado ou não)
 * - delete: remove o item (as imagens ficam no bucket)
 * - order: grava a nova ordem dos itens de uma divisão
 */
export const POST: APIRoute = async (context) => {
	if (!context.locals.user || !context.locals.isAdmin) return json({ error: "Acesso negado." }, 403);
	if (!validOrigin(context.request)) return json({ error: "Origem inválida." }, 403);

	let body: { action?: string; item?: unknown; id?: unknown; division?: unknown; ids?: unknown };
	try {
		body = await context.request.json();
	} catch {
		return json({ error: "JSON inválido." }, 400);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const client = createSupabaseRequestClient(context) as SupabaseClient<any>;
	const userId = context.locals.user.id;

	try {
		if (body.action === "save") {
			const { item, errors } = validateShowcaseItem(body.item);
			if (!item) return json({ error: errors.join("\n") }, 422);
			const { error } = await client.from("showcase_items").upsert(showcaseToRow(item, userId), { onConflict: "id" });
			if (error) throw error;
			return json({ ok: true });
		}

		if (body.action === "delete") {
			if (typeof body.id !== "string") return json({ error: "Item inválido." }, 400);
			const { error } = await client.from("showcase_items").delete().eq("id", body.id);
			if (error) throw error;
			return json({ ok: true });
		}

		if (body.action === "order") {
			if (!isShowcaseDivision(body.division) || !Array.isArray(body.ids) || body.ids.some((x) => typeof x !== "string") || body.ids.length > 200) {
				return json({ error: "Ordem inválida." }, 400);
			}
			for (const [index, id] of (body.ids as string[]).entries()) {
				const { error } = await client.from("showcase_items").update({ sort_order: index * 10, updated_by: userId }).eq("id", id).eq("division", body.division);
				if (error) throw error;
			}
			return json({ ok: true });
		}

		return json({ error: "Ação inválida." }, 400);
	} catch (error) {
		const e = error as { code?: string; message?: string };
		if (isShowcaseMissing(e)) return json({ error: "A vitrine ainda não foi ativada no banco (migração pendente)." }, 503);
		if (e.code === "42501") return json({ error: "Acesso negado." }, 403);
		if (e.code === "23514" || e.code === "22P02") return json({ error: "Dados inválidos. Revise os campos." }, 422);
		console.error("[Noden] Falha na vitrine.", error);
		return json({ error: "Não foi possível salvar. Tente de novo." }, 500);
	}
};
