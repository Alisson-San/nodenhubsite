import assert from "node:assert/strict";
import { test } from "node:test";
import type { CatalogDocument } from "../catalog/editorTypes";
import { canMove, moveWithinGroup, newItem, newServiceCard, parsePrice, removeItem, upsertItem } from "./inlineDocument";

const page = "00000000-0000-4000-8000-000000000000";
const base = (): CatalogDocument => ({ schemaVersion: 1, division: "home", items: [], serviceCards: [], details: {} });
const ordered = [
	{ id: "a", sort_order: 0, category_id: "x" },
	{ id: "b", sort_order: 10, category_id: "y" },
	{ id: "c", sort_order: 20, category_id: "x" },
	{ id: "d", sort_order: 30, category_id: "x" },
];

test("move dentro da mesma categoria, sem tocar outras", () => {
	const moved = moveWithinGroup(ordered, "c", -1);
	const x = moved.filter((i) => i.category_id === "x").sort((p, q) => p.sort_order - q.sort_order).map((i) => i.id);
	assert.deepEqual(x, ["c", "a", "d"]);
	assert.deepEqual(moved.find((i) => i.id === "b"), ordered[1]);
	assert.equal(ordered[2].sort_order, 20, "não altera a lista original");
});

test("limites do grupo bloqueiam o movimento", () => {
	assert.equal(canMove(ordered, "a", -1), false);
	assert.equal(canMove(ordered, "d", 1), false);
	assert.equal(canMove(ordered, "b", 1), false);
	assert.equal(canMove(ordered, "a", 1), true);
});

test("novo item entra no fim da categoria e é removido com seus detalhes", () => {
	let doc = base();
	const first = newItem(doc, page, "x", "11111111-1111-4111-8111-111111111111");
	doc = upsertItem(doc, { ...first, name: "A", description: "a" });
	const second = newItem(doc, page, "x");
	assert.equal(second.sort_order, first.sort_order + 10);
	doc.details[first.id] = {} as never;
	doc = removeItem(doc, first.id);
	assert.equal(doc.items.length, 0);
	assert.equal(doc.details[first.id], undefined);
});

test("card de solução começa ativo e no fim", () => {
	const card = newServiceCard(base(), page);
	assert.equal(card.is_active, true);
	assert.equal(card.sort_order, 0);
});

test("preço aceita formato brasileiro", () => {
	assert.equal(parsePrice("R$ 1.234,50"), 1234.5);
	assert.equal(parsePrice("90"), 90);
	assert.equal(parsePrice("12.5"), 12.5);
	assert.equal(parsePrice(""), null);
	assert.equal(parsePrice("-3"), null);
});
