import type {
	Enums,
} from "../../types/database.types";

export type PriceType =
	Enums<"price_type">;

export type CatalogItemKind =
	Enums<"catalog_item_kind">;

export const priceTypeOptions: Array<{
	value: PriceType;
	label: string;
	description: string;
}> = [
	{
		value: "fixed",
		label: "Preço fixo",
		description:
			"Exibe diretamente o valor informado.",
	},
	{
		value: "starting_at",
		label: "A partir de",
		description:
			"Exibe o menor valor inicial do serviço.",
	},
	{
		value: "consultation",
		label: "Sob consulta",
		description:
			"Não exige valor numérico.",
	},
	{
		value: "free",
		label: "Gratuito",
		description:
			"Exibe o serviço como sem custo.",
	},
];

export const catalogItemKindOptions:
	Array<{
		value: CatalogItemKind;
		label: string;
		description: string;
	}> = [
		{
			value: "service",
			label: "Serviço",
			description:
				"Atendimento ou execução técnica.",
		},
		{
			value: "package",
			label: "Pacote",
			description:
				"Conjunto de serviços vendido como solução.",
		},
		{
			value: "product",
			label: "Produto",
			description:
				"Item físico ou digital comercializado.",
		},
		{
			value: "consulting",
			label: "Consultoria",
			description:
				"Diagnóstico, orientação ou projeto especializado.",
		},
	];

export const catalogItemKindLabels:
	Record<
		CatalogItemKind,
		string
	> = {
		service: "Serviço",
		package: "Pacote",
		product: "Produto",
		consulting: "Consultoria",
	};

export function isPriceType(
	value: string,
): value is PriceType {
	return priceTypeOptions.some(
		(option) =>
			option.value === value,
	);
}

export function isCatalogItemKind(
	value: string,
): value is CatalogItemKind {
	return catalogItemKindOptions.some(
		(option) =>
			option.value === value,
	);
}

export function priceRequiresValue(
	type: PriceType,
): boolean {
	return (
		type === "fixed" ||
		type === "starting_at"
	);
}
