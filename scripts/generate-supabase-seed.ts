import {
	createHash,
} from "node:crypto";

import {
	mkdirSync,
	writeFileSync,
} from "node:fs";

import {
	dirname,
	resolve,
} from "node:path";

import {
	siteConfig,
} from "../src/config/site";

import {
	dataPage,
	gamePage,
	homePage,
} from "../src/data/servicePages";

import type {
	CatalogBadge,
	CatalogCategory,
	CatalogItemKind,
	CatalogTier,
	PricingItem,
	ServiceDivision,
	ServicePageConfig,
} from "../src/types/services";

const pages: ServicePageConfig[] = [
	homePage,
	gamePage,
	dataPage,
];

interface CategorySeed {
	division: ServiceDivision;
	category: CatalogCategory;
	sortOrder: number;
}

interface TierSeed {
	tier: CatalogTier;
	sortOrder: number;
}

interface BadgeSeed {
	badge: CatalogBadge;
	sortOrder: number;
}

function sqlString(
	value:
		| string
		| null
		| undefined,
): string {
	if (
		value === null ||
		value === undefined
	) {
		return "null";
	}

	return `'${value.replaceAll(
		"'",
		"''",
	)}'`;
}

function sqlJson(
	value: unknown,
): string {
	return `${
		sqlString(
			JSON.stringify(
				value,
			),
		)
	}::jsonb`;
}

function sqlBoolean(
	value: boolean,
): string {
	return value
		? "true"
		: "false";
}

function sqlNumber(
	value:
		| number
		| null
		| undefined,
): string {
	return (
		value === null ||
		value === undefined
	)
		? "null"
		: String(value);
}

function hashValue(
	value: string,
): string {
	return createHash("sha256")
		.update(value)
		.digest("hex")
		.slice(0, 8);
}

function slugify(
	value: string,
	fallbackPrefix: string,
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

	return (
		normalized ||
		`${fallbackPrefix}-${hashValue(
			value,
		)}`
	);
}

function resolvePriceType(
	item: PricingItem,
):
	| "fixed"
	| "starting_at"
	| "consultation"
	| "free" {
	if (
		typeof item.price ===
		"number"
	) {
		const prefix =
			item.pricePrefix
				?.toLocaleLowerCase(
					"pt-BR",
				) ?? "";

		return prefix.includes(
			"partir",
		)
			? "starting_at"
			: "fixed";
	}

	const label =
		item.priceLabel
			?.toLocaleLowerCase(
				"pt-BR",
			) ?? "";

	if (
		label.includes(
			"sem custo",
		) ||
		label.includes(
			"gratuito",
		) ||
		label.includes(
			"grátis",
		)
	) {
		return "free";
	}

	return "consultation";
}

function resolveItemKind(
	item: PricingItem,
): CatalogItemKind {
	return (
		item.itemKind ??
		"service"
	);
}

function resolveTier(
	item: PricingItem,
): CatalogTier | undefined {
	if (item.tier) {
		return {
			...item.tier,

			slug:
				item.tier.slug ||
				slugify(
					item.tier.name,
					"nivel",
				),
		};
	}

	if (!item.badge) {
		return undefined;
	}

	return {
		name: item.badge,

		slug:
			slugify(
				item.badge,
				"nivel",
			),

		color: "#4f8cff",
	};
}

function buildSettingUpsert(
	key: string,
	value: unknown,
	description: string,
): string {
	return `
insert into public.site_settings (
	key,
	value,
	description,
	is_public
)
values (
	${sqlString(key)},
	${sqlJson(value)},
	${sqlString(description)},
	true
)
on conflict (key)
do update set
	value = excluded.value,
	description = excluded.description,
	is_public = excluded.is_public,
	updated_at = now();
`.trim();
}

function buildPageUpsert(
	page: ServicePageConfig,
): string {
	return `
insert into public.service_pages (
	division,
	seo_title,
	seo_description,
	canonical_path,
	accent_color,
	accent_secondary_color,
	hero_eyebrow,
	hero_title,
	hero_description,
	hero_highlights,
	hero_primary_label,
	hero_primary_message,
	hero_secondary_label,
	hero_secondary_href,
	services_eyebrow,
	services_title,
	services_description,
	pricing_eyebrow,
	pricing_title,
	pricing_description,
	pricing_disclaimer,
	cta_eyebrow,
	cta_title,
	cta_description,
	cta_button_label,
	cta_message,
	cta_secondary_label,
	cta_secondary_href,
	is_published
)
values (
	${sqlString(page.division)}::public.service_division,
	${sqlString(page.seo.title)},
	${sqlString(page.seo.description)},
	${sqlString(page.seo.canonical)},
	${sqlString(page.theme.accent)},
	${sqlString(page.theme.accentSecondary)},
	${sqlString(page.hero.eyebrow)},
	${sqlString(page.hero.title)},
	${sqlString(page.hero.description)},
	${sqlJson(page.hero.highlights)},
	${sqlString(page.hero.primaryLabel)},
	${sqlString(page.hero.primaryMessage)},
	${sqlString(page.hero.secondaryLabel)},
	${sqlString(page.hero.secondaryHref)},
	${sqlString(page.servicesSection.eyebrow)},
	${sqlString(page.servicesSection.title)},
	${sqlString(page.servicesSection.description)},
	${sqlString(page.pricingSection.eyebrow)},
	${sqlString(page.pricingSection.title)},
	${sqlString(page.pricingSection.description)},
	${sqlString(page.pricingSection.disclaimer)},
	${sqlString(page.cta.eyebrow)},
	${sqlString(page.cta.title)},
	${sqlString(page.cta.description)},
	${sqlString(page.cta.buttonLabel)},
	${sqlString(page.cta.message)},
	${sqlString(page.cta.secondaryLabel)},
	${sqlString(page.cta.secondaryHref)},
	true
)
on conflict (division)
do update set
	seo_title = excluded.seo_title,
	seo_description = excluded.seo_description,
	canonical_path = excluded.canonical_path,
	accent_color = excluded.accent_color,
	accent_secondary_color = excluded.accent_secondary_color,
	hero_eyebrow = excluded.hero_eyebrow,
	hero_title = excluded.hero_title,
	hero_description = excluded.hero_description,
	hero_highlights = excluded.hero_highlights,
	hero_primary_label = excluded.hero_primary_label,
	hero_primary_message = excluded.hero_primary_message,
	hero_secondary_label = excluded.hero_secondary_label,
	hero_secondary_href = excluded.hero_secondary_href,
	services_eyebrow = excluded.services_eyebrow,
	services_title = excluded.services_title,
	services_description = excluded.services_description,
	pricing_eyebrow = excluded.pricing_eyebrow,
	pricing_title = excluded.pricing_title,
	pricing_description = excluded.pricing_description,
	pricing_disclaimer = excluded.pricing_disclaimer,
	cta_eyebrow = excluded.cta_eyebrow,
	cta_title = excluded.cta_title,
	cta_description = excluded.cta_description,
	cta_button_label = excluded.cta_button_label,
	cta_message = excluded.cta_message,
	cta_secondary_label = excluded.cta_secondary_label,
	cta_secondary_href = excluded.cta_secondary_href,
	is_published = excluded.is_published,
	updated_at = now();
`.trim();
}

function buildServiceInsert(
	page: ServicePageConfig,
	index: number,
): string {
	const service =
		page.services[index];

	return `
insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	${sqlString(service.title)},
	${sqlString(service.description)},
	${sqlJson(service.features ?? [])},
	${sqlString(service.badge)},
	true,
	${index}
from public.service_pages as page
where page.division =
	${sqlString(page.division)}::public.service_division;
`.trim();
}

function buildCategoryUpsert(
	item: CategorySeed,
): string {
	const category =
		item.category;

	return `
insert into public.catalog_categories (
	service_page_id,
	name,
	slug,
	description,
	icon_key,
	color,
	is_active,
	sort_order
)
select
	page.id,
	${sqlString(category.name)},
	${sqlString(category.slug)},
	${sqlString(category.description)},
	${sqlString(category.iconKey)},
	${sqlString(category.color)},
	true,
	${item.sortOrder}
from public.service_pages as page
where page.division =
	${sqlString(item.division)}::public.service_division
on conflict (
	service_page_id,
	slug
)
do update set
	name = excluded.name,
	description = excluded.description,
	icon_key = excluded.icon_key,
	color = excluded.color,
	is_active = excluded.is_active,
	sort_order = excluded.sort_order,
	updated_at = now();
`.trim();
}

function buildTierUpsert(
	item: TierSeed,
): string {
	const tier =
		item.tier;

	return `
insert into public.catalog_tiers (
	name,
	slug,
	description,
	color,
	is_active,
	sort_order
)
values (
	${sqlString(tier.name)},
	${sqlString(tier.slug)},
	${sqlString(tier.description)},
	${sqlString(tier.color)},
	true,
	${item.sortOrder}
)
on conflict (slug)
do update set
	name = excluded.name,
	description = excluded.description,
	color = excluded.color,
	is_active = excluded.is_active,
	sort_order = excluded.sort_order,
	updated_at = now();
`.trim();
}

function buildBadgeUpsert(
	item: BadgeSeed,
): string {
	const badge =
		item.badge;

	return `
insert into public.catalog_badges (
	name,
	slug,
	icon_key,
	text_color,
	background_color,
	border_color,
	is_active,
	sort_order
)
values (
	${sqlString(badge.name)},
	${sqlString(badge.slug)},
	${sqlString(badge.iconKey)},
	${sqlString(badge.textColor)},
	${sqlString(badge.backgroundColor)},
	${sqlString(badge.borderColor)},
	true,
	${item.sortOrder}
)
on conflict (slug)
do update set
	name = excluded.name,
	icon_key = excluded.icon_key,
	text_color = excluded.text_color,
	background_color = excluded.background_color,
	border_color = excluded.border_color,
	is_active = excluded.is_active,
	sort_order = excluded.sort_order,
	updated_at = now();
`.trim();
}

function buildPricingInsert(
	page: ServicePageConfig,
	index: number,
): string {
	const item =
		page.pricing[index];

	const priceType =
		resolvePriceType(item);

	const itemKind =
		resolveItemKind(item);

	const categoryIdSql =
		item.category
			? `(
				select category.id
				from public.catalog_categories
					as category
				where category.service_page_id =
						page.id
					and category.slug =
						${sqlString(
							item.category.slug,
						)}
				limit 1
			)`
			: "null";

	const tier =
		resolveTier(item);

	const tierIdSql =
		tier
			? `(
				select tier.id
				from public.catalog_tiers
					as tier
				where tier.slug =
					${sqlString(
						tier.slug,
					)}
				limit 1
			)`
			: "null";

	return `
insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	compare_at_price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	category_id,
	tier_id,
	item_kind,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	${sqlString(item.name)},
	${sqlString(item.description)},
	${sqlString(priceType)}::public.price_type,
	${sqlNumber(item.price)},
	${sqlNumber(item.compareAtPrice)},
	${sqlString(item.pricePrefix)},
	${sqlString(item.priceLabel)},
	${sqlString(item.priceSuffix)},
	${sqlJson(item.features ?? [])},
	${categoryIdSql},
	${tierIdSql},
	${sqlString(itemKind)}::public.catalog_item_kind,
	${sqlString(item.badge)},
	${sqlString(item.note)},
	${sqlBoolean(item.featured ?? false)},
	true,
	${index},
	${sqlString(item.ctaLabel)},
	${sqlString(item.ctaMessage)}
from public.service_pages as page
where page.division =
	${sqlString(page.division)}::public.service_division;
`.trim();
}

function buildPricingBadgeInsert(
	page: ServicePageConfig,
	pricingIndex: number,
	badge: CatalogBadge,
	badgeIndex: number,
): string {
	const item =
		page.pricing[
			pricingIndex
		];

	return `
insert into public.pricing_item_badges (
	pricing_item_id,
	badge_id,
	sort_order
)
select
	pricing.id,
	badge.id,
	${badgeIndex}
from public.pricing_items
	as pricing
join public.service_pages
	as page
	on page.id =
		pricing.service_page_id
join public.catalog_badges
	as badge
	on badge.slug =
		${sqlString(
			badge.slug,
		)}
where page.division =
		${sqlString(
			page.division,
		)}::public.service_division
	and pricing.sort_order =
		${pricingIndex}
	and pricing.name =
		${sqlString(
			item.name,
		)}
on conflict (
	pricing_item_id,
	badge_id
)
do update set
	sort_order =
		excluded.sort_order,
	updated_at = now();
`.trim();
}

function buildSocialLinkUpsert(
	platform: string,
	label: string,
	url: string,
	username: string | null,
	sortOrder: number,
	isActive: boolean,
): string {
	return `
insert into public.social_links (
	platform,
	label,
	url,
	username,
	is_active,
	sort_order
)
values (
	${sqlString(platform)},
	${sqlString(label)},
	${sqlString(url)},
	${sqlString(username)},
	${sqlBoolean(isActive)},
	${sortOrder}
)
on conflict (platform)
do update set
	label = excluded.label,
	url = excluded.url,
	username = excluded.username,
	is_active = excluded.is_active,
	sort_order = excluded.sort_order,
	updated_at = now();
`.trim();
}

const categoriesByKey =
	new Map<
		string,
		CategorySeed
	>();

const tiersBySlug =
	new Map<
		string,
		TierSeed
	>();

const badgesBySlug =
	new Map<
		string,
		BadgeSeed
	>();

for (const page of pages) {
	for (
		const item of
			page.pricing
	) {
		if (item.category) {
			const slug =
				item.category.slug ||
				slugify(
					item.category.name,
					"categoria",
				);

			const key =
				`${page.division}:${slug}`;

			if (
				!categoriesByKey.has(
					key,
				)
			) {
				categoriesByKey.set(
					key,
					{
						division:
							page.division,

						category: {
							...item.category,
							slug,
						},

						sortOrder:
							categoriesByKey
								.size * 10,
					},
				);
			}
		}

		const tier =
			resolveTier(item);

		if (
			tier &&
			!tiersBySlug.has(
				tier.slug,
			)
		) {
			tiersBySlug.set(
				tier.slug,
				{
					tier,

					sortOrder:
						tiersBySlug
							.size * 10,
				},
			);
		}

		for (
			const badge of
				item.badges ?? []
		) {
			const slug =
				badge.slug ||
				slugify(
					badge.name,
					"selo",
				);

			if (
				!badgesBySlug.has(
					slug,
				)
			) {
				badgesBySlug.set(
					slug,
					{
						badge: {
							...badge,
							slug,
						},

						sortOrder:
							badgesBySlug
								.size * 10,
					},
				);
			}
		}
	}
}

const settings = [
	buildSettingUpsert(
		"site.identity",
		{
			name:
				siteConfig.name,

			legalName:
				siteConfig.legalName,

			description:
				siteConfig.description,

			url:
				siteConfig.url,

			locale:
				siteConfig.locale,
		},
		"Identidade e informações institucionais da Noden.",
	),

	buildSettingUpsert(
		"site.contact",
		{
			phone:
				siteConfig.phone,

			email:
				siteConfig.email,

			address:
				siteConfig.address,

			serviceHours:
				siteConfig
					.serviceHours,

			whatsapp:
				siteConfig.whatsapp,
		},
		"Dados públicos de contato.",
	),

	buildSettingUpsert(
		"site.service_areas",
		{
			items:
				siteConfig
					.serviceAreas,
		},
		"Municípios e regiões atendidas.",
	),
];

const pageUpserts =
	pages.map(
		buildPageUpsert,
	);

const categoryUpserts =
	[
		...categoriesByKey
			.values(),
	].map(
		buildCategoryUpsert,
	);

const tierUpserts =
	[
		...tiersBySlug
			.values(),
	].map(
		buildTierUpsert,
	);

const badgeUpserts =
	[
		...badgesBySlug
			.values(),
	].map(
		buildBadgeUpsert,
	);

const serviceInserts =
	pages.flatMap(
		(page) =>
			page.services.map(
				(_, index) =>
					buildServiceInsert(
						page,
						index,
					),
			),
	);

const pricingInserts =
	pages.flatMap(
		(page) =>
			page.pricing.map(
				(_, index) =>
					buildPricingInsert(
						page,
						index,
					),
			),
	);

const pricingBadgeInserts =
	pages.flatMap(
		(page) =>
			page.pricing.flatMap(
				(item, pricingIndex) =>
					(
						item.badges ??
						[]
					).map(
						(
							badge,
							badgeIndex,
						) =>
							buildPricingBadgeInsert(
								page,
								pricingIndex,
								badge,
								badgeIndex,
							),
					),
			),
	);

const socialLinks =
	siteConfig.socialLinks.map(
		(item) =>
			buildSocialLinkUpsert(
				item.platform,
				item.label,
				item.url,
				item.username ??
					null,
				item.sortOrder,
				item.isActive,
			),
	);

const seedSql = `
-- Este arquivo é gerado automaticamente.
-- Execute: npm run db:seed:generate
-- Não altere manualmente.

begin;

-- Evita preencher o histórico de auditoria com a carga inicial.
alter table public.site_settings
	disable trigger site_settings_write_audit;

alter table public.service_pages
	disable trigger service_pages_write_audit;

alter table public.services
	disable trigger services_write_audit;

alter table public.pricing_items
	disable trigger pricing_items_write_audit;

alter table public.social_links
	disable trigger social_links_write_audit;

alter table public.catalog_categories
	disable trigger catalog_categories_write_audit;

alter table public.catalog_tiers
	disable trigger catalog_tiers_write_audit;

alter table public.catalog_badges
	disable trigger catalog_badges_write_audit;

alter table public.pricing_item_badges
	disable trigger pricing_item_badges_write_audit;

${settings.join("\n\n")}

${pageUpserts.join("\n\n")}

${categoryUpserts.join("\n\n")}

${tierUpserts.join("\n\n")}

${badgeUpserts.join("\n\n")}

-- Recria os filhos das três páginas para manter o seed reproduzível.
delete from public.pricing_items
where service_page_id in (
	select id
	from public.service_pages
	where division in (
		'home',
		'game',
		'data'
	)
);

delete from public.services
where service_page_id in (
	select id
	from public.service_pages
	where division in (
		'home',
		'game',
		'data'
	)
);

${serviceInserts.join("\n\n")}

${pricingInserts.join("\n\n")}

${pricingBadgeInserts.join("\n\n")}

${socialLinks.join("\n\n")}

alter table public.site_settings
	enable trigger site_settings_write_audit;

alter table public.service_pages
	enable trigger service_pages_write_audit;

alter table public.services
	enable trigger services_write_audit;

alter table public.pricing_items
	enable trigger pricing_items_write_audit;

alter table public.social_links
	enable trigger social_links_write_audit;

alter table public.catalog_categories
	enable trigger catalog_categories_write_audit;

alter table public.catalog_tiers
	enable trigger catalog_tiers_write_audit;

alter table public.catalog_badges
	enable trigger catalog_badges_write_audit;

alter table public.pricing_item_badges
	enable trigger pricing_item_badges_write_audit;

commit;
`.trimStart();

const outputPath = resolve(
	process.cwd(),
	"supabase/seed.sql",
);

mkdirSync(
	dirname(outputPath),
	{
		recursive: true,
	},
);

writeFileSync(
	outputPath,
	seedSql,
	"utf8",
);

console.log(
	`Seed gerado em: ${outputPath}`,
);

console.log(
	`Páginas: ${pages.length}`,
);

console.log(
	`Serviços: ${pages.reduce(
		(total, page) =>
			total +
			page.services.length,
		0,
	)}`,
);

console.log(
	`Valores: ${pages.reduce(
		(total, page) =>
			total +
			page.pricing.length,
		0,
	)}`,
);

console.log(
	`Categorias: ${
		categoriesByKey.size
	}`,
);

console.log(
	`Níveis: ${
		tiersBySlug.size
	}`,
);

console.log(
	`Selos: ${
		badgesBySlug.size
	}`,
);
