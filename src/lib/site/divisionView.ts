import type { AstroGlobal } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../../types/database.types";
import type { PricingItem, ServiceDivision, ServiceItem, ServicePageConfig } from "../../types/services";
import type { RuntimeSiteConfig } from "../../types/site";
import type { CatalogDocument, PageTexts, ProductDetail } from "../catalog/editorTypes";
import { loadServicePage } from "../services/serviceRepository";
import { loadSiteConfig } from "./siteRepository";
import { loadPublicSetting } from "./settingsRepository";
import { DIVISION_CONTENT_KEY, readDivisionExtras, type DivisionExtras } from "./divisionContent";
import { pageTextsFromRow } from "./pageTexts";
import { loadProductDetails, resolveProductMedia } from "../catalog/productRepository";
import { getEditorSnapshot } from "../catalog/draftRepository";
import { createSupabaseRequestClient } from "../supabase/request";
import { modernizePath } from "./divisions";
import { buildFixtureView, devEditorFixtureEnabled } from "./devEditorFixture";

type Choice = { id: string; name: string };

/** Dados que o editor do site recebe no navegador. */
export interface EditorBootstrap {
	division: ServiceDivision;
	ready: boolean;
	hasDraft: boolean;
	revision: number;
	baseRevision: number;
	pageId: string | null;
	document: CatalogDocument & { page: PageTexts; extras: DivisionExtras };
	categories: Choice[];
	tiers: Choice[];
	badges: Choice[];
	message?: string;
}

export interface DivisionView {
	page: ServicePageConfig;
	site: RuntimeSiteConfig;
	extras: DivisionExtras;
	details: Record<string, ProductDetail>;
	source: "supabase" | "fallback" | "draft";
	editor?: EditorBootstrap;
}

const strings = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];

/** Converte o documento editorial na estrutura usada pelas páginas. */
export function documentToPage(
	base: ServicePageConfig,
	doc: CatalogDocument,
	texts: PageTexts,
	taxonomy: {
		categories: Tables<"catalog_categories">[];
		tiers: Tables<"catalog_tiers">[];
		badges: Tables<"catalog_badges">[];
	},
): ServicePageConfig {
	const categoryOrder = new Map(taxonomy.categories.map((c, i) => [c.id, c.sort_order ?? i]));
	const items: PricingItem[] = [...doc.items]
		.sort(
			(a, b) =>
				(categoryOrder.get(a.category_id ?? "") ?? 9999) - (categoryOrder.get(b.category_id ?? "") ?? 9999) ||
				a.sort_order - b.sort_order,
		)
		.map((x) => {
			const category = taxonomy.categories.find((c) => c.id === x.category_id);
			const tier = taxonomy.tiers.find((t) => t.id === x.tier_id);
			return {
				id: x.id,
				inactive: !x.is_active,
				name: x.name,
				description: x.description,
				itemKind: x.item_kind,
				price: x.price,
				compareAtPrice: x.compare_at_price,
				pricePrefix: x.price_prefix ?? (x.price_type === "starting_at" ? "A partir de" : undefined),
				priceLabel: x.price_label ?? (x.price_type === "free" ? "Sem custo" : x.price_type === "consultation" ? "Sob consulta" : undefined),
				priceSuffix: x.price_suffix ?? undefined,
				features: strings(x.features),
				category: category
					? {
							id: category.id,
							name: category.name,
							slug: category.slug,
							description: category.description ?? undefined,
							color: category.color,
							iconKey: category.icon_key ?? undefined,
						}
					: undefined,
				tier: tier
					? { id: tier.id, name: tier.name, slug: tier.slug, description: tier.description ?? undefined, color: tier.color }
					: undefined,
				badges: taxonomy.badges
					.filter((b) => x.badge_ids.includes(b.id))
					.map((b) => ({
						id: b.id,
						name: b.name,
						slug: b.slug,
						iconKey: b.icon_key ?? undefined,
						textColor: b.text_color,
						backgroundColor: b.background_color,
						borderColor: b.border_color,
					})),
				featured: x.is_featured,
				note: x.note ?? undefined,
				ctaLabel: x.cta_label ?? undefined,
				ctaMessage: x.cta_message ?? undefined,
			};
		});

	const services: ServiceItem[] = [...doc.serviceCards]
		.sort((a, b) => a.sort_order - b.sort_order)
		.map((x) => ({
			id: x.id,
			inactive: !x.is_active,
			title: x.title,
			description: x.description,
			badge: x.badge ?? undefined,
			features: strings(x.features),
		}));

	return {
		...base,
		seo: { ...base.seo, title: texts.seo_title, description: texts.seo_description },
		hero: {
			...base.hero,
			eyebrow: texts.hero_eyebrow,
			title: texts.hero_title,
			description: texts.hero_description,
			highlights: texts.hero_highlights,
			primaryLabel: texts.hero_primary_label || undefined,
			primaryMessage: texts.hero_primary_message,
			secondaryLabel: texts.hero_secondary_label || undefined,
		},
		servicesSection: { ...base.servicesSection, title: texts.services_title, description: texts.services_description },
		pricingSection: {
			...base.pricingSection,
			title: texts.pricing_title,
			description: texts.pricing_description,
			disclaimer: texts.pricing_disclaimer || undefined,
		},
		cta: {
			...base.cta,
			title: texts.cta_title,
			description: texts.cta_description,
			buttonLabel: texts.cta_button_label,
			message: texts.cta_message,
		},
		services,
		pricing: items,
	};
}

async function loadAdminView(
	division: ServiceDivision,
	astro: AstroGlobal,
	base: ServicePageConfig,
	site: RuntimeSiteConfig,
	publishedExtras: DivisionExtras,
): Promise<DivisionView | null> {
	const client = createSupabaseRequestClient({ request: astro.request, cookies: astro.cookies }) as SupabaseClient<Database>;
	const [snapshot, row] = await Promise.all([
		getEditorSnapshot(client, division),
		client.from("service_pages").select("*").eq("division", division).maybeSingle(),
	]);
	if (row.error || !row.data) return null;

	const draft = snapshot.draft?.document;
	const document = structuredClone(draft ?? snapshot.published) as CatalogDocument;
	const page = document.page ?? pageTextsFromRow(row.data);
	const extras = document.extras ?? publishedExtras;
	const fullDocument = { ...document, page, extras };

	const details = Object.fromEntries(
		await Promise.all(
			Object.entries(document.details ?? {}).map(async ([id, detail]) => [id, await resolveProductMedia(detail, client)] as const),
		),
	);

	const view = documentToPage(base, document, page, snapshot);
	view.cta.secondaryHref = view.cta.secondaryHref ? modernizePath(view.cta.secondaryHref) : undefined;

	return {
		page: view,
		site,
		extras,
		details,
		source: "draft",
		editor: {
			division,
			ready: snapshot.ready,
			hasDraft: Boolean(snapshot.draft),
			revision: snapshot.draft?.revision ?? 0,
			baseRevision: snapshot.draft?.baseRevision ?? snapshot.sourceRevision,
			pageId: snapshot.pageId,
			document: fullDocument,
			categories: snapshot.categories.map((c) => ({ id: c.id, name: c.name })),
			tiers: snapshot.tiers.map((t) => ({ id: t.id, name: t.name })),
			badges: snapshot.badges.map((b) => ({ id: b.id, name: b.name })),
			message: snapshot.message,
		},
	};
}

export async function loadDivisionView(division: ServiceDivision, astro: AstroGlobal): Promise<DivisionView | null> {
	const [loaded, site, extrasValue] = await Promise.all([
		loadServicePage(division),
		loadSiteConfig(),
		loadPublicSetting(DIVISION_CONTENT_KEY),
	]);
	if (!loaded) return null;
	const extras = readDivisionExtras(extrasValue, division);

	if (devEditorFixtureEnabled(astro.request)) {
		return buildFixtureView(loaded.page, site, extras);
	}

	if (astro.locals.isAdmin && loaded.source === "supabase") {
		try {
			const view = await loadAdminView(division, astro, loaded.page, site, extras);
			if (view) return view;
		} catch (error) {
			console.error("[Noden] Modo de edição indisponível; exibindo versão pública.", error);
		}
	}

	return {
		page: loaded.page,
		site,
		extras,
		details: await loadProductDetails(division),
		source: loaded.source,
	};
}
