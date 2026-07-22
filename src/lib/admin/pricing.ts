import type {
	Enums,
} from "../../types/database.types";

export type PriceType =
	Enums<"price_type">;

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

export function isPriceType(
	value: string,
): value is PriceType {
	return priceTypeOptions.some(
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