import type { AstroGlobal } from "astro";
import type { ServiceDivision } from "../../types/services";
import type { RuntimeSiteConfig } from "../../types/site";
import { loadSiteConfig } from "./siteRepository";
import { loadServicePage } from "../services/serviceRepository";
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

async function startingPrice(division: ServiceDivision): Promise<number | null> {
	const loaded = await loadServicePage(division);
	if (!loaded) return null;
	const prices = loaded.page.pricing
		.map((item) => item.price)
		.filter((price): price is number => typeof price === "number" && price > 0);
	return prices.length ? Math.min(...prices) : null;
}

export async function loadHomeView(astro: AstroGlobal): Promise<HomeView> {
	const [site, home, game, data] = await Promise.all([
		loadSiteConfig(),
		startingPrice("home"),
		startingPrice("game"),
		startingPrice("data"),
	]);
	const view: HomeView = { site, content: site.home, startingPrices: { home, game, data } };

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
