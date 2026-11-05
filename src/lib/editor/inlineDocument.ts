import type { CatalogDocument, CatalogEditorItem, CatalogServiceCard } from "../catalog/editorTypes";

/**
 * Operações puras sobre o documento editorial usadas pelo editor do site.
 * Nenhuma delas altera o documento recebido.
 */

type Ordered = { id: string; sort_order: number; category_id?: string | null };

function renumber<T extends Ordered>(list: T[]): T[] {
	return list.map((item, index) => ({ ...item, sort_order: index * 10 }));
}

/** Move um item uma posição dentro do mesmo grupo (categoria). */
export function moveWithinGroup<T extends Ordered>(list: T[], id: string, direction: -1 | 1): T[] {
	const target = list.find((x) => x.id === id);
	if (!target) return list;
	const sameGroup = (x: T) => (x.category_id ?? null) === (target.category_id ?? null);
	const group = list.filter(sameGroup).sort((a, b) => a.sort_order - b.sort_order);
	const index = group.findIndex((x) => x.id === id);
	const swap = index + direction;
	if (swap < 0 || swap >= group.length) return list;
	[group[index], group[swap]] = [group[swap], group[index]];
	const reordered = renumber(group);
	const byId = new Map(reordered.map((x) => [x.id, x]));
	return list.map((x) => byId.get(x.id) ?? x);
}

export function canMove<T extends Ordered>(list: T[], id: string, direction: -1 | 1): boolean {
	return moveWithinGroup(list, id, direction) !== list;
}

export function removeItem(doc: CatalogDocument, id: string): CatalogDocument {
	const details = { ...doc.details };
	delete details[id];
	return {
		...doc,
		items: doc.items.filter((x) => x.id !== id),
		serviceCards: doc.serviceCards.filter((x) => x.id !== id),
		details,
	};
}

export function upsertItem(doc: CatalogDocument, item: CatalogEditorItem): CatalogDocument {
	const exists = doc.items.some((x) => x.id === item.id);
	return { ...doc, items: exists ? doc.items.map((x) => (x.id === item.id ? item : x)) : [...doc.items, item] };
}

export function upsertServiceCard(doc: CatalogDocument, card: CatalogServiceCard): CatalogDocument {
	const exists = doc.serviceCards.some((x) => x.id === card.id);
	return {
		...doc,
		serviceCards: exists ? doc.serviceCards.map((x) => (x.id === card.id ? card : x)) : [...doc.serviceCards, card],
	};
}

const nextOrder = (list: Ordered[], categoryId: string | null = null) =>
	Math.max(-10, ...list.filter((x) => (x.category_id ?? null) === categoryId).map((x) => x.sort_order)) + 10;

export function newItem(doc: CatalogDocument, pageId: string, categoryId: string | null, id = crypto.randomUUID()): CatalogEditorItem {
	const now = new Date().toISOString();
	return {
		id,
		service_page_id: pageId,
		name: "",
		description: "",
		item_kind: "service",
		price_type: "fixed",
		price: 0,
		compare_at_price: null,
		price_prefix: null,
		price_label: null,
		price_suffix: null,
		features: [],
		category_id: categoryId,
		tier_id: null,
		badge: null,
		badge_ids: [],
		note: null,
		cta_label: null,
		cta_message: null,
		is_active: true,
		is_featured: false,
		sort_order: nextOrder(doc.items, categoryId),
		created_at: now,
		updated_at: now,
		updated_by: null,
	};
}

export function newServiceCard(doc: CatalogDocument, pageId: string, id = crypto.randomUUID()): CatalogServiceCard {
	const now = new Date().toISOString();
	return {
		id,
		service_page_id: pageId,
		title: "",
		description: "",
		features: [],
		badge: null,
		is_active: true,
		sort_order: nextOrder(doc.serviceCards),
		created_at: now,
		updated_at: now,
		updated_by: null,
	};
}

export const splitLines = (value: string): string[] =>
	value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

/** Converte o texto digitado em valor numérico (aceita "1.234,50"). */
export function parsePrice(value: string): number | null {
	const cleaned = value.replace(/[^\d,.-]/g, "").trim();
	if (!cleaned) return null;
	const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
	const number = Number(normalized);
	return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : null;
}
