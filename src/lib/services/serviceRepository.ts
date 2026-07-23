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
	CatalogBadge,
	CatalogCategory,
	CatalogTier,
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

type CategoryRow =
	Tables<"catalog_categories">;

type TierRow =
	Tables<"catalog_tiers">;

type BadgeRow =
	Tables<"catalog_badges">;

type PricingBadgeRow =
	Tables<"pricing_item_badges">;

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
	value:
		| string
		| null
		| undefined,
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

function slugify(
	value: string,
): string {
	const normalized = value
		.normalize("NFD")
		.replace(
			/[\u0300-\u036f]/g,
			"",
		)
		.toLocaleLowerCase("pt-BR")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return normalized || "nivel";
}

function mapService(
	row: ServiceRow,
): ServiceItem {
	return {
		title: row.title,
		description: row.description,

		features:
			toStringArray(
				row.features,
			),

		badge:
			optionalString(
				row.badge,
			),
	};
}

function mapCategory(
	row: CategoryRow,
): CatalogCategory {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,

		description:
			optionalString(
				row.description,
			),

		iconKey:
			optionalString(
				row.icon_key,
			),

		color: row.color,
	};
}

function mapTier(
	row: TierRow,
): CatalogTier {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,

		description:
			optionalString(
				row.description,
			),

		color: row.color,
	};
}

function mapBadge(
	row: BadgeRow,
): CatalogBadge {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,

		iconKey:
			optionalString(
				row.icon_key,
			),

		textColor:
			row.text_color,

		backgroundColor:
			row.background_color,

		borderColor:
			row.border_color,
	};
}

function legacyTierFromBadge(
	badge:
		| string
		| null,
): CatalogTier | undefined {
	if (!badge) {
		return undefined;
	}

	return {
		id:
			`legacy:${slugify(
				badge,
			)}`,

		name: badge,
		slug: slugify(badge),
		color: "#4f8cff",
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

function groupBadgesByPricingItem(
	links: PricingBadgeRow[],
	badgesById:
		Map<string, CatalogBadge>,
): Map<
	string,
	CatalogBadge[]
> {
	const grouped =
		new Map<
			string,
			Array<{
				badge:
					CatalogBadge;
				sortOrder:
					number;
				createdAt:
					string;
			}>
		>();

	for (const link of links) {
		const badge =
			badgesById.get(
				link.badge_id,
			);

		if (!badge) {
			continue;
		}

		const current =
			grouped.get(
				link.pricing_item_id,
			) ?? [];

		current.push({
			badge,

			sortOrder:
				link.sort_order,

			createdAt:
				link.created_at,
		});

		grouped.set(
			link.pricing_item_id,
			current,
		);
	}

	return new Map(
		[...grouped.entries()].map(
			([
				pricingItemId,
				items,
			]) => [
				pricingItemId,

				items
					.sort(
						(a, b) =>
							a.sortOrder -
								b.sortOrder ||
							a.createdAt.localeCompare(
								b.createdAt,
							),
					)
					.map(
						(item) =>
							item.badge,
					),
			],
		),
	);
}

function mapPricing(
	row: PricingRow,

	categoriesById:
		Map<
			string,
			CatalogCategory
		>,

	tiersById:
		Map<
			string,
			CatalogTier
		>,

	badgesByPricingItem:
		Map<
			string,
			CatalogBadge[]
		>,
): PricingItem {
	const tier =
		(
			row.tier_id
				? tiersById.get(
						row.tier_id,
					)
				: undefined
		) ??
		legacyTierFromBadge(
			row.badge,
		);

	return {
		id: row.id,

		name: row.name,
		description:
			row.description,

		itemKind:
			row.item_kind,

		price: row.price,

		compareAtPrice:
			row.compare_at_price,

		pricePrefix:
			resolvePricePrefix(
				row,
			),

		priceLabel:
			resolvePriceLabel(
				row,
			),

		priceSuffix:
			optionalString(
				row.price_suffix,
			),

		features:
			toStringArray(
				row.features,
			),

		category:
			row.category_id
				? categoriesById.get(
						row.category_id,
					)
				: undefined,

		tier,

		badges:
			badgesByPricingItem.get(
				row.id,
			) ?? [],

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

	categoriesById:
		Map<
			string,
			CatalogCategory
		>,

	tiersById:
		Map<
			string,
			CatalogTier
		>,

	badgesByPricingItem:
		Map<
			string,
			CatalogBadge[]
		>,
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
				(item) =>
					mapPricing(
						item,
						categoriesById,
						tiersById,
						badgesByPricingItem,
					),
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
			categoriesResult,
			tiersResult,
			badgesResult,
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

			supabase
				.from(
					"catalog_categories",
				)
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
				.from(
					"catalog_tiers",
				)
				.select("*")
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
				.from(
					"catalog_badges",
				)
				.select("*")
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

		if (categoriesResult.error) {
			throw new Error(
				`Falha ao consultar as categorias de ${division}: ${categoriesResult.error.message}`,
			);
		}

		if (tiersResult.error) {
			throw new Error(
				`Falha ao consultar os níveis do catálogo: ${tiersResult.error.message}`,
			);
		}

		if (badgesResult.error) {
			throw new Error(
				`Falha ao consultar os selos do catálogo: ${badgesResult.error.message}`,
			);
		}

		const pricingRows =
			pricingResult.data ?? [];

		let badgeLinks:
			PricingBadgeRow[] = [];

		if (
			pricingRows.length > 0
		) {
			const badgeLinksResult =
				await supabase
					.from(
						"pricing_item_badges",
					)
					.select("*")
					.in(
						"pricing_item_id",
						pricingRows.map(
							(item) =>
								item.id,
						),
					)
					.order(
						"sort_order",
						{
							ascending:
								true,
						},
					);

			if (
				badgeLinksResult.error
			) {
				throw new Error(
					`Falha ao consultar os selos dos valores de ${division}: ${badgeLinksResult.error.message}`,
				);
			}

			badgeLinks =
				badgeLinksResult.data ??
				[];
		}

		const categoriesById =
			new Map(
				(
					categoriesResult.data ??
					[]
				).map(
					(row) => {
						const category =
							mapCategory(
								row,
							);

						return [
							row.id,
							category,
						] as const;
					},
				),
			);

		const tiersById =
			new Map(
				(
					tiersResult.data ??
					[]
				).map(
					(row) => {
						const tier =
							mapTier(
								row,
							);

						return [
							row.id,
							tier,
						] as const;
					},
				),
			);

		const badgesById =
			new Map(
				(
					badgesResult.data ??
					[]
				).map(
					(row) => {
						const badge =
							mapBadge(
								row,
							);

						return [
							row.id,
							badge,
						] as const;
					},
				),
			);

		const badgesByPricingItem =
			groupBadgesByPricingItem(
				badgeLinks,
				badgesById,
			);

		return {
			page: mapServicePage(
				pageResult.data,
				servicesResult.data ??
					[],
				pricingRows,
				categoriesById,
				tiersById,
				badgesByPricingItem,
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
