import {
	catalogIconOptions,
	getCatalogIconSymbol,
	isCatalogIconKey,
} from "../catalog/icons";

export {
	catalogIconOptions,
	getCatalogIconSymbol,
	isCatalogIconKey,
};

export type {
	CatalogIconKey,
} from "../catalog/icons";

export type TaxonomyEntityType =
	| "category"
	| "tier"
	| "badge";

export const taxonomyEntityLabels:
	Record<TaxonomyEntityType, string> = {
		category: "Categoria",
		tier: "Nível",
		badge: "Selo",
	};

export function normalizeCatalogSlug(
	value: string,
): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase("pt-BR")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
