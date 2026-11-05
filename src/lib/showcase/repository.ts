import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { SHOWCASE_BUCKET, type ShowcaseDivision, type ShowcaseItem } from "./types";

// A tabela ainda não está nos tipos gerados (migração 20261105180000_showcase).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>;

interface Row {
	id: string;
	division: ShowcaseDivision;
	title: string;
	summary: string;
	category: string;
	tags: unknown;
	specs: unknown;
	link_url: string | null;
	media: unknown;
	is_published: boolean;
	sort_order: number;
}

export interface ShowcaseLoad {
	/** false quando a migração ainda não foi aplicada. */
	ready: boolean;
	items: ShowcaseItem[];
}

export function isShowcaseMissing(error: { code?: string; message?: string } | null): boolean {
	return !!error && (["42P01", "PGRST205", "PGRST202"].includes(error.code ?? "") || /showcase_items/.test(error.message ?? ""));
}

const list = <T>(value: unknown, keep: (x: unknown) => x is T): T[] => (Array.isArray(value) ? value.filter(keep) : []);

export function mapShowcaseRow(row: Row, client: AnyClient): ShowcaseItem {
	return {
		id: row.id,
		division: row.division,
		title: row.title,
		summary: row.summary,
		category: row.category,
		tags: list(row.tags, (x): x is string => typeof x === "string"),
		specs: list(row.specs, (x): x is { label: string; value: string } => !!x && typeof x === "object" && typeof (x as { label?: unknown }).label === "string"),
		linkUrl: row.link_url,
		media: list(row.media, (x): x is { path: string; alt: string } => !!x && typeof x === "object" && typeof (x as { path?: unknown }).path === "string").map((m) => ({
			...m,
			url: client.storage.from(SHOWCASE_BUCKET).getPublicUrl(m.path).data.publicUrl,
		})),
		isPublished: row.is_published,
		sortOrder: row.sort_order,
	};
}

/**
 * Itens da vitrine. Com o cliente da sessão de um admin, inclui rascunhos;
 * com o cliente público, só os publicados (garantido também pela RLS).
 */
export async function loadShowcase(division: ShowcaseDivision, client?: AnyClient, includeDrafts = false): Promise<ShowcaseLoad> {
	try {
		const supabase = client ?? (createSupabaseServerClient() as AnyClient);
		let query = supabase.from("showcase_items").select("*").eq("division", division).order("sort_order").order("created_at");
		if (!includeDrafts) query = query.eq("is_published", true);
		const { data, error } = await query;
		if (error) {
			if (isShowcaseMissing(error)) return { ready: false, items: [] };
			throw error;
		}
		return { ready: true, items: ((data ?? []) as Row[]).map((row) => mapShowcaseRow(row, supabase)) };
	} catch (error) {
		console.error(`[Noden] Vitrine ${division} indisponível.`, error);
		return { ready: false, items: [] };
	}
}

export function showcaseToRow(item: ShowcaseItem, userId?: string) {
	return {
		id: item.id,
		division: item.division,
		title: item.title,
		summary: item.summary,
		category: item.category,
		tags: item.tags,
		specs: item.specs,
		link_url: item.linkUrl,
		media: item.media.map(({ path, alt }) => ({ path, alt })),
		is_published: item.isPublished,
		sort_order: item.sortOrder,
		updated_by: userId ?? null,
	};
}
