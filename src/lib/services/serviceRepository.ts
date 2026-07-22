import {
	dataPage,
	gamePage,
	homePage,
} from "../../data/servicePages";

import type {
	Json,
	Tables,
} from "../../types/database.types";

import type {
	PricingItem,
	ServiceDivision,
	ServiceItem,
	ServicePageConfig,
} from "../../types/services";

import {
	createSupabaseServerClient,
} from "../supabase/server";

type ServicePageRow =
	Tables<"service_pages">;

type ServiceRow =
	Tables<"services">;

type PricingRow =
	Tables<"pricing_items">;

export type ServicePageSource =
	| "supabase"
	| "fallback";

export interface LoadedServicePage {
	page: ServicePageConfig;
	source: ServicePageSource;
}

const fallbackPages: Record<
	ServiceDivision,
	ServicePageConfig
> = {
	home: homePage,
	game: gamePage,
	data: dataPage,
};

function optionalString(
	value: string | null,
): string | undefined {
	return value ?? undefined;
}

function toStringArray(
	value: Json,
): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		(item): item is string =>
			typeof item === "string",
	);
}

function mapService(
	row: ServiceRow,
): ServiceItem {
	return {
		title: row.title,
		description: row.description,
		features: toStringArray(
			row.features,
		),
		badge: optionalString(
			row.badge,
		),
	};
}

function resolvePricePrefix(
	row: PricingRow,
): string | undefined {
	if (row.price_prefix) {
		return row.price_prefix;
	}

	if (
		row.price_type ===
		"starting_at"
	) {
		return "A partir de";
	}

	return undefined;
}

function resolvePriceLabel(
	row: PricingRow,
): string | undefined {
	if (row.price_label) {
		return row.price_label;
	}

	if (
		row.price_type ===
		"consultation"
	) {
		return "Sob consulta";
	}

	if (
		row.price_type ===
		"free"
	) {
		return "Sem custo";
	}

	return undefined;
}

function mapPricing(
	row: PricingRow,
): PricingItem {
	return {
		name: row.name,
		description: row.description,

		price: row.price,

		pricePrefix:
			resolvePricePrefix(row),

		priceLabel:
			resolvePriceLabel(row),

		priceSuffix:
			optionalString(
				row.price_suffix,
			),

		features:
			toStringArray(
				row.features,
			),

		featured:
			row.is_featured,

		badge:
			optionalString(
				row.badge,
			),

		note:
			optionalString(
				row.note,
			),

		ctaLabel:
			optionalString(
				row.cta_label,
			),

		ctaMessage:
			optionalString(
				row.cta_message,
			),
	};
}

function mapServicePage(
	row: ServicePageRow,
	services: ServiceRow[],
	pricing: PricingRow[],
): ServicePageConfig {
	return {
		division: row.division,

		seo: {
			title:
				row.seo_title,

			description:
				row.seo_description,

			canonical:
				row.canonical_path,
		},

		theme: {
			accent:
				row.accent_color,

			accentSecondary:
				row.accent_secondary_color,
		},

		hero: {
			eyebrow:
				row.hero_eyebrow,

			title:
				row.hero_title,

			description:
				row.hero_description,

			highlights:
				toStringArray(
					row.hero_highlights,
				),

			primaryLabel:
				optionalString(
					row.hero_primary_label,
				),

			primaryMessage:
				row.hero_primary_message,

			secondaryLabel:
				optionalString(
					row.hero_secondary_label,
				),

			secondaryHref:
				optionalString(
					row.hero_secondary_href,
				),
		},

		servicesSection: {
			eyebrow:
				optionalString(
					row.services_eyebrow,
				),

			title:
				row.services_title,

			description:
				row.services_description,
		},

		services:
			services.map(
				mapService,
			),

		pricingSection: {
			eyebrow:
				optionalString(
					row.pricing_eyebrow,
				),

			title:
				row.pricing_title,

			description:
				row.pricing_description,

			disclaimer:
				optionalString(
					row.pricing_disclaimer,
				),
		},

		pricing:
			pricing.map(
				mapPricing,
			),

		cta: {
			eyebrow:
				row.cta_eyebrow,

			title:
				row.cta_title,

			description:
				row.cta_description,

			buttonLabel:
				row.cta_button_label,

			message:
				row.cta_message,

			secondaryLabel:
				optionalString(
					row.cta_secondary_label,
				),

			secondaryHref:
				optionalString(
					row.cta_secondary_href,
				),
		},
	};
}

function getErrorMessage(
	error: unknown,
): string {
	if (
		error instanceof Error
	) {
		return error.message;
	}

	return String(error);
}

export async function loadServicePage(
	division: ServiceDivision,
): Promise<
	LoadedServicePage | null
> {
	const fallback =
		fallbackPages[division];

	try {
		const supabase =
			createSupabaseServerClient();

		const pageResult =
			await supabase
				.from("service_pages")
				.select("*")
				.eq(
					"division",
					division,
				)
				.eq(
					"is_published",
					true,
				)
				.maybeSingle();

		if (pageResult.error) {
			throw new Error(
				`Falha ao consultar a página ${division}: ${pageResult.error.message}`,
			);
		}

		/*
		 * A consulta funcionou, mas a página não está publicada
		 * ou não existe. Não usamos fallback neste caso, porque
		 * isso impediria o administrador de ocultar uma página.
		 */
		if (!pageResult.data) {
			return null;
		}

		const [
			servicesResult,
			pricingResult,
		] = await Promise.all([
			supabase
				.from("services")
				.select("*")
				.eq(
					"service_page_id",
					pageResult.data.id,
				)
				.eq(
					"is_active",
					true,
				)
				.order(
					"sort_order",
					{
						ascending: true,
					},
				),

			supabase
				.from("pricing_items")
				.select("*")
				.eq(
					"service_page_id",
					pageResult.data.id,
				)
				.eq(
					"is_active",
					true,
				)
				.order(
					"sort_order",
					{
						ascending: true,
					},
				),
		]);

		if (servicesResult.error) {
			throw new Error(
				`Falha ao consultar os serviços de ${division}: ${servicesResult.error.message}`,
			);
		}

		if (pricingResult.error) {
			throw new Error(
				`Falha ao consultar os valores de ${division}: ${pricingResult.error.message}`,
			);
		}

		return {
			page: mapServicePage(
				pageResult.data,
				servicesResult.data ?? [],
				pricingResult.data ?? [],
			),

			source: "supabase",
		};
	} catch (error) {
		console.error(
			`[Noden] Supabase indisponível para ${division}. Usando conteúdo estático.`,
			getErrorMessage(error),
		);

		return {
			page: fallback,
			source: "fallback",
		};
	}
}