import type { ServicePageConfig } from "../../types/services";
import type { RuntimeSiteConfig } from "../../types/site";
import type { CatalogDocument, CatalogEditorItem, CatalogServiceCard, PageTexts } from "../catalog/editorTypes";
import type { DivisionExtras } from "./divisionContent";
import type { DivisionView } from "./divisionView";

/**
 * Somente desenvolvimento local: mostra o modo de edição com os dados de
 * fallback, para testar a interface sem banco. Exige `astro dev`,
 * DEV_EDITOR_FIXTURE=true e acesso por localhost. Nada é gravado: as
 * chamadas de API continuam exigindo sessão de administrador real.
 */
export function devEditorFixtureEnabled(request: Request): boolean {
	if (!import.meta.env.DEV || import.meta.env.DEV_EDITOR_FIXTURE !== "true") return false;
	const host = new URL(request.url).hostname;
	return host === "localhost" || host === "127.0.0.1";
}

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export function buildFixtureView(base: ServicePageConfig, site: RuntimeSiteConfig, extras: DivisionExtras): DivisionView {
	const pageId = uuid(1);
	const now = new Date().toISOString();
	let counter = 100;
	const categoryIds = new Map<string, string>();
	const categories: { id: string; name: string }[] = [];
	for (const item of base.pricing) {
		const name = item.category?.name;
		if (name && !categoryIds.has(name)) {
			const id = uuid(counter++);
			categoryIds.set(name, id);
			categories.push({ id, name });
		}
	}

	const items: CatalogEditorItem[] = base.pricing.map((item, index) => ({
		id: uuid(1000 + index),
		service_page_id: pageId,
		name: item.name,
		description: item.description,
		item_kind: item.itemKind ?? "service",
		price_type: typeof item.price === "number" ? (item.pricePrefix ? "starting_at" : "fixed") : "consultation",
		price: typeof item.price === "number" ? item.price : null,
		compare_at_price: item.compareAtPrice ?? null,
		price_prefix: null,
		price_label: null,
		price_suffix: item.priceSuffix ?? null,
		features: item.features ?? [],
		category_id: item.category?.name ? categoryIds.get(item.category.name)! : null,
		tier_id: null,
		badge: null,
		badge_ids: [],
		note: item.note ?? null,
		cta_label: item.ctaLabel ?? null,
		cta_message: item.ctaMessage ?? null,
		is_active: true,
		is_featured: Boolean(item.featured),
		sort_order: index * 10,
		created_at: now,
		updated_at: now,
		updated_by: null,
	}));

	const serviceCards: CatalogServiceCard[] = base.services.map((service, index) => ({
		id: uuid(2000 + index),
		service_page_id: pageId,
		title: service.title,
		description: service.description,
		features: service.features ?? [],
		badge: service.badge ?? null,
		is_active: true,
		sort_order: index * 10,
		created_at: now,
		updated_at: now,
		updated_by: null,
	}));

	const page: PageTexts = {
		hero_eyebrow: base.hero.eyebrow,
		hero_title: base.hero.title,
		hero_description: base.hero.description,
		hero_highlights: base.hero.highlights,
		hero_primary_label: base.hero.primaryLabel ?? "",
		hero_primary_message: base.hero.primaryMessage,
		hero_secondary_label: base.hero.secondaryLabel ?? "",
		services_title: base.servicesSection.title,
		services_description: base.servicesSection.description,
		pricing_title: base.pricingSection.title,
		pricing_description: base.pricingSection.description,
		pricing_disclaimer: base.pricingSection.disclaimer ?? "",
		cta_title: base.cta.title,
		cta_description: base.cta.description,
		cta_button_label: base.cta.buttonLabel,
		cta_message: base.cta.message,
		seo_title: base.seo.title,
		seo_description: base.seo.description,
	};

	const document: CatalogDocument & { page: PageTexts; extras: DivisionExtras } = {
		schemaVersion: 1,
		division: base.division,
		items,
		serviceCards,
		details: {},
		page,
		extras,
	};

	const view: ServicePageConfig = {
		...base,
		services: base.services.map((service, index) => ({ ...service, id: serviceCards[index].id })),
		pricing: base.pricing.map((item, index) => ({ ...item, id: items[index].id, category: item.category ? { ...item.category, id: items[index].category_id ?? undefined } : undefined })),
	};

	return {
		page: view,
		site,
		extras,
		details: {},
		source: "draft",
		editor: {
			division: base.division,
			ready: true,
			hasDraft: false,
			revision: 0,
			baseRevision: 0,
			pageId,
			document,
			categories,
			tiers: [],
			badges: [],
			message: "Modo de teste local (dados de fallback).",
		},
	};
}
