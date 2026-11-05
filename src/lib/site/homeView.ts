import type { AstroGlobal } from "astro";
import type { ServiceDivision } from "../../types/services";
import type { RuntimeSiteConfig } from "../../types/site";
import { loadSiteConfig } from "./siteRepository";
import { createSupabaseServerClient } from "../supabase/server";
import { dataPage, gamePage, homePage } from "../../data/servicePages";
import type { ServicePageConfig } from "../../types/services";
import { createSupabaseRequestClient } from "../supabase/request";
import { loadPrivateSetting } from "./settingsRepository";
import { devEditorFixtureEnabled } from "./devEditorFixture";
import { homeContentFields, readHomeContent, type HomeContent } from "./homeContent";

export const HOME_DRAFT_KEY = "site.home_draft";

export interface HomeEditorState {
	hasDraft: boolean;
	content: HomeContent;
	fields: typeof homeContentFields;
}

export interface HomeView {
	site: RuntimeSiteConfig;
	content: HomeContent;
	startingPrices: Record<ServiceDivision, number | null>;
	editor?: HomeEditorState;
}

/**
 * Menor valor de cada divisão para o "a partir de" da inicial.
 * Uma única consulta (antes, a inicial carregava as três páginas inteiras).
 */
export async function loadStartingPrices(): Promise<Record<ServiceDivision, number | null>> {
	const result: Record<ServiceDivision, number | null> = { home: null, game: null, data: null };
	const keep = (division: ServiceDivision, price: unknown) => {
		if (typeof price !== "number" || price <= 0) return;
		result[division] = result[division] === null ? price : Math.min(result[division]!, price);
	};
	try {
		const { data, error } = await createSupabaseServerClient()
			.from("pricing_items")
			.select("price, service_pages!inner(division, is_published)")
			.eq("is_active", true)
			.gt("price", 0)
			.eq("service_pages.is_published", true);
		if (error) throw error;
		for (const row of data ?? []) {
			const page = row.service_pages as unknown as { division: ServiceDivision } | null;
			if (page) keep(page.division, Number(row.price));
		}
		return result;
	} catch (error) {
		console.error("[Noden] Preços iniciais indisponíveis; usando conteúdo de reserva.", error);
		for (const [division, page] of Object.entries({ home: homePage, game: gamePage, data: dataPage }) as [ServiceDivision, ServicePageConfig][]) {
			for (const item of page.pricing) keep(division, item.price);
		}
		return result;
	}
}

export async function loadHomeView(astro: AstroGlobal): Promise<HomeView> {
	const [site, startingPrices] = await Promise.all([loadSiteConfig(), loadStartingPrices()]);
	const view: HomeView = { site, content: site.home, startingPrices };

	if (devEditorFixtureEnabled(astro.request)) {
		view.editor = { hasDraft: false, content: site.home, fields: homeContentFields };
		return view;
	}

	if (astro.locals.isAdmin) {
		try {
			const client = createSupabaseRequestClient({ request: astro.request, cookies: astro.cookies });
			const draft = await loadPrivateSetting(client, HOME_DRAFT_KEY);
			const content = draft ? readHomeContent(draft) : site.home;
			view.content = content;
			view.editor = { hasDraft: Boolean(draft), content, fields: homeContentFields };
		} catch (error) {
			console.error("[Noden] Edição da inicial indisponível.", error);
		}
	}

	return view;
}
