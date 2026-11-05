/**
 * "Monte seu orçamento": soma de referência dos itens escolhidos no catálogo
 * e mensagem pronta para o WhatsApp. Valores são de referência. Itens
 * gratuitos somam zero; só itens sob consulta ficam fora do total.
 */
export interface QuoteItem {
	id: string;
	name: string;
	/** Valor numérico do item, quando houver. */
	price: number | null;
	/** "A partir de": o total também passa a ser "a partir de". */
	startingAt: boolean;
	/** Texto do preço como aparece no site (ex.: "Sob consulta"). */
	priceText: string;
	/** Item gratuito: soma zero e não conta como "sob consulta". */
	free?: boolean;
}

export interface QuoteSummary {
	count: number;
	total: number;
	startingAt: boolean;
	/** Itens sob consulta (sem valor na soma). Gratuitos não contam aqui. */
	withoutPrice: number;
}

export function summarizeQuote(items: QuoteItem[]): QuoteSummary {
	let total = 0;
	let startingAt = false;
	let withoutPrice = 0;
	for (const item of items) {
		if (item.free) continue;
		if (typeof item.price === "number" && Number.isFinite(item.price)) {
			total += item.price;
			if (item.startingAt) startingAt = true;
		} else withoutPrice++;
	}
	return { count: items.length, total: Math.round(total * 100) / 100, startingAt, withoutPrice };
}

const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function quoteTotalText(summary: QuoteSummary): string {
	if (!summary.count) return "";
	if (summary.total <= 0) return summary.withoutPrice ? "Sob consulta" : "Sem custo";
	const base = `${summary.startingAt ? "a partir de " : ""}${brl(summary.total)}`;
	return summary.withoutPrice ? `${base} + ${summary.withoutPrice} sob consulta` : base;
}

export function buildQuoteMessage(divisionName: string, items: QuoteItem[]): string {
	const summary = summarizeQuote(items);
	const lines = items.map((item) => `• ${item.name} (${item.priceText})`);
	return [
		`Olá! Vim pelo site (${divisionName}) e quero um orçamento para:`,
		...lines,
		"",
		`Total de referência: ${quoteTotalText(summary)}.`,
	].join("\n");
}
