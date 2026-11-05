/**
 * Vitrine: projetos da Noden Data (sites, sistemas, dashboards) e setups
 * montados pela Noden Game. Tabela public.showcase_items e bucket público
 * showcase-media (migração 20261105185813_showcase.sql).
 */
export type ShowcaseDivision = "game" | "data";

export interface ShowcaseMedia {
	/** Caminho no bucket showcase-media (UUID + extensão). */
	path: string;
	alt: string;
	/** URL pública, preenchida na leitura. */
	url?: string;
}

export interface ShowcaseSpec {
	label: string;
	value: string;
}

export interface ShowcaseItem {
	id: string;
	division: ShowcaseDivision;
	title: string;
	summary: string;
	category: string;
	tags: string[];
	specs: ShowcaseSpec[];
	linkUrl: string | null;
	media: ShowcaseMedia[];
	isPublished: boolean;
	sortOrder: number;
}

export const SHOWCASE_BUCKET = "showcase-media";

export const showcaseLimits = {
	title: 120,
	summary: 800,
	category: 60,
	tags: 12,
	tag: 40,
	specs: 16,
	specLabel: 40,
	specValue: 120,
	media: 12,
	alt: 300,
	link: 2048,
} as const;

export const isShowcaseDivision = (value: unknown): value is ShowcaseDivision => value === "game" || value === "data";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mediaPath = /^[0-9a-f-]{36}\.(png|jpg|webp)$/i;

/** Valida e normaliza um item vindo do editor. Retorna erros ou o item limpo. */
export function validateShowcaseItem(input: unknown): { item?: ShowcaseItem; errors: string[] } {
	const errors: string[] = [];
	if (!input || typeof input !== "object") return { errors: ["Item inválido."] };
	const raw = input as Record<string, unknown>;
	const text = (key: string, max: number, required = false) => {
		const value = typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
		if (required && !value) errors.push("Informe o título.");
		if (value.length > max) errors.push(`Campo muito longo (máximo ${max} caracteres).`);
		return value;
	};

	const id = typeof raw.id === "string" && uuidPattern.test(raw.id) ? raw.id : "";
	if (!id) errors.push("Identificador inválido.");
	if (!isShowcaseDivision(raw.division)) errors.push("Divisão inválida.");

	const title = text("title", showcaseLimits.title, true);
	const summary = text("summary", showcaseLimits.summary);
	const category = text("category", showcaseLimits.category);

	const tags = Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean) : [];
	if (tags.length > showcaseLimits.tags || tags.some((t) => t.length > showcaseLimits.tag)) errors.push(`Use até ${showcaseLimits.tags} etiquetas curtas.`);

	const specs = Array.isArray(raw.specs)
		? raw.specs
				.filter((s): s is ShowcaseSpec => !!s && typeof s === "object" && typeof (s as ShowcaseSpec).label === "string" && typeof (s as ShowcaseSpec).value === "string")
				.map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
				.filter((s) => s.label || s.value)
		: [];
	if (specs.length > showcaseLimits.specs || specs.some((s) => !s.label || !s.value || s.label.length > showcaseLimits.specLabel || s.value.length > showcaseLimits.specValue)) {
		errors.push(`Especificações: até ${showcaseLimits.specs} linhas no formato "Nome: valor".`);
	}

	let linkUrl: string | null = typeof raw.linkUrl === "string" && raw.linkUrl.trim() ? raw.linkUrl.trim() : null;
	if (linkUrl) {
		try {
			const url = new URL(linkUrl);
			if (url.protocol !== "https:" || url.username || url.password || linkUrl.length > showcaseLimits.link) throw new Error();
		} catch {
			errors.push("O link precisa começar com https://.");
			linkUrl = null;
		}
	}

	const media = Array.isArray(raw.media)
		? raw.media
				.filter((m): m is ShowcaseMedia => !!m && typeof m === "object" && typeof (m as ShowcaseMedia).path === "string")
				.map((m) => ({ path: m.path, alt: typeof m.alt === "string" ? m.alt.trim() : "" }))
		: [];
	if (media.length > showcaseLimits.media) errors.push(`Use até ${showcaseLimits.media} imagens.`);
	if (media.some((m) => !mediaPath.test(m.path))) errors.push("Imagem inválida.");
	if (media.some((m) => !m.alt || m.alt.length > showcaseLimits.alt)) errors.push("Descreva cada imagem (texto alternativo).");

	const sortOrder = Number.isInteger(raw.sortOrder) && (raw.sortOrder as number) >= 0 ? (raw.sortOrder as number) : 0;

	if (errors.length) return { errors };
	return {
		errors,
		item: {
			id,
			division: raw.division as ShowcaseDivision,
			title,
			summary,
			category,
			tags,
			specs,
			linkUrl,
			media,
			isPublished: raw.isPublished === true,
			sortOrder,
		},
	};
}

/** "Nome: valor" por linha → especificações. */
export function parseSpecs(text: string): ShowcaseSpec[] {
	return text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const index = line.indexOf(":");
			return index < 0 ? { label: line, value: "" } : { label: line.slice(0, index).trim(), value: line.slice(index + 1).trim() };
		});
}

export const specsToText = (specs: ShowcaseSpec[]) => specs.map((s) => `${s.label}: ${s.value}`).join("\n");
