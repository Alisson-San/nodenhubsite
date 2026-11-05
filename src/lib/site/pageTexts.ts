import type { Tables, TablesUpdate } from "../../types/database.types";
import { pageTextKeys, type PageTextKey, type PageTexts } from "../catalog/editorTypes";

type PageRow = Tables<"service_pages">;

/** Limites dos textos editáveis no site, com rótulos para o editor. */
export const pageTextFields: Record<PageTextKey, { label: string; max: number; required: boolean; multiline?: boolean }> = {
	hero_eyebrow: { label: "Chamada acima do título", max: 80, required: true },
	hero_title: { label: "Título principal", max: 120, required: true },
	hero_description: { label: "Texto da abertura", max: 400, required: true, multiline: true },
	hero_primary_label: { label: "Botão principal", max: 50, required: false },
	hero_primary_message: { label: "Mensagem do WhatsApp (botão principal)", max: 500, required: true, multiline: true },
	hero_secondary_label: { label: "Link secundário", max: 50, required: false },
	services_title: { label: "Título das soluções", max: 140, required: true },
	services_description: { label: "Texto das soluções", max: 500, required: true, multiline: true },
	pricing_title: { label: "Título dos preços", max: 140, required: true },
	pricing_description: { label: "Texto dos preços", max: 500, required: true, multiline: true },
	pricing_disclaimer: { label: "Observação dos preços", max: 800, required: false, multiline: true },
	cta_title: { label: "Título da chamada final", max: 140, required: true },
	cta_description: { label: "Texto da chamada final", max: 500, required: true, multiline: true },
	cta_button_label: { label: "Botão da chamada final", max: 50, required: true },
	cta_message: { label: "Mensagem do WhatsApp (chamada final)", max: 500, required: true, multiline: true },
	seo_title: { label: "Título no Google", max: 90, required: true },
	seo_description: { label: "Descrição no Google", max: 200, required: true, multiline: true },
};

export const highlightLimits = { maxItems: 6, maxLength: 100 };

export function pageTextsFromRow(row: PageRow): PageTexts {
	const texts = {} as PageTexts;
	for (const key of pageTextKeys) {
		texts[key] = (row[key] as string | null) ?? "";
	}
	texts.hero_highlights = Array.isArray(row.hero_highlights)
		? row.hero_highlights.filter((x): x is string => typeof x === "string")
		: [];
	return texts;
}

export function validatePageTexts(value: unknown): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!value || typeof value !== "object" || Array.isArray(value)) return { page: "Textos inválidos." };
	const record = value as Record<string, unknown>;
	for (const key of pageTextKeys) {
		const field = pageTextFields[key];
		const text = record[key];
		if (typeof text !== "string") {
			errors["page." + key] = `${field.label}: valor inválido.`;
			continue;
		}
		if (field.required && !text.trim()) errors["page." + key] = `${field.label}: obrigatório.`;
		if (text.length > field.max) errors["page." + key] = `${field.label}: até ${field.max} caracteres.`;
	}
	const highlights = record.hero_highlights;
	if (
		!Array.isArray(highlights) ||
		highlights.length > highlightLimits.maxItems ||
		highlights.some((x) => typeof x !== "string" || !x.trim() || x.length > highlightLimits.maxLength)
	) {
		errors["page.hero_highlights"] = `Destaques: até ${highlightLimits.maxItems} itens de ${highlightLimits.maxLength} caracteres.`;
	}
	return errors;
}

export function pageTextsToUpdate(texts: PageTexts, userId?: string): TablesUpdate<"service_pages"> {
	const update: TablesUpdate<"service_pages"> = { hero_highlights: texts.hero_highlights };
	for (const key of pageTextKeys) {
		const value = texts[key].trim();
		const field = pageTextFields[key];
		(update as Record<string, unknown>)[key] = field.required ? value : value || null;
	}
	if (userId) update.updated_by = userId;
	return update;
}
