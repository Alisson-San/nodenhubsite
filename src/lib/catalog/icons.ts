export const catalogIconOptions = [
	{ value: "tag", label: "Etiqueta", symbol: "🏷️" },
	{ value: "promotion", label: "Promoção", symbol: "💸" },
	{ value: "popular", label: "Popular", symbol: "🔥" },
	{ value: "recommended", label: "Recomendado", symbol: "⭐" },
	{ value: "new", label: "Novidade", symbol: "🆕" },
	{ value: "fast", label: "Rápido", symbol: "⚡" },
	{ value: "shield", label: "Garantia", symbol: "🛡️" },
	{ value: "computer", label: "Computador", symbol: "💻" },
	{ value: "cleaning", label: "Limpeza", symbol: "🧹" },
	{ value: "tools", label: "Manutenção", symbol: "🛠️" },
	{ value: "package", label: "Pacote", symbol: "📦" },
	{ value: "product", label: "Produto", symbol: "🛒" },
	{ value: "service", label: "Serviço", symbol: "🔧" },
	{ value: "network", label: "Rede e internet", symbol: "🌐" },
	{ value: "software", label: "Software", symbol: "🧩" },
	{ value: "data", label: "Dados e BI", symbol: "📊" },
] as const;

export type CatalogIconKey =
	(typeof catalogIconOptions)[number]["value"];

export function isCatalogIconKey(
	value: string,
): value is CatalogIconKey {
	return catalogIconOptions.some(
		(option) => option.value === value,
	);
}

export function getCatalogIconSymbol(
	value: string | null | undefined,
	fallback = "🏷️",
): string {
	return (
		catalogIconOptions.find(
			(option) => option.value === value,
		)?.symbol ?? fallback
	);
}
