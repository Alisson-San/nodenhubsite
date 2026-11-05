import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQuoteMessage, quoteTotalText, summarizeQuote, type QuoteItem } from "./quote";

const item = (name: string, price: number | null, startingAt = false, priceText = price === null ? "Sob consulta" : `R$ ${price}`): QuoteItem => ({
	id: name,
	name,
	price,
	startingAt,
	priceText,
});

test("soma só itens com valor e marca 'a partir de'", () => {
	const summary = summarizeQuote([item("A", 90), item("B", 50.5, true), item("C", null)]);
	assert.equal(summary.total, 140.5);
	assert.equal(summary.startingAt, true);
	assert.equal(summary.withoutPrice, 1);
	assert.match(quoteTotalText(summary), /^a partir de R\$\s?140,50 \+ 1 sob consulta$/);
});

test("valor fixo não leva 'a partir de'; só sob consulta vira sob consulta", () => {
	assert.match(quoteTotalText(summarizeQuote([item("A", 100)])), /^R\$\s?100,00$/);
	assert.equal(quoteTotalText(summarizeQuote([item("A", null)])), "Sob consulta");
	assert.equal(quoteTotalText(summarizeQuote([])), "");
});

test("mensagem lista os itens e o total de referência", () => {
	const message = buildQuoteMessage("Noden Home", [item("Formatação", 90, true, "A partir de R$ 90,00"), item("Wi-Fi", null)]);
	assert.match(message, /Noden Home/);
	assert.match(message, /• Formatação \(A partir de R\$ 90,00\)/);
	assert.match(message, /• Wi-Fi \(Sob consulta\)/);
	assert.match(message, /Total de referência: a partir de R\$\s?90,00 \+ 1 sob consulta\./);
});
