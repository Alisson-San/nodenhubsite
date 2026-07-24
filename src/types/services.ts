export type ServiceDivision =
	| "home"
	| "game"
	| "data";

export type CatalogItemKind =
	| "service"
	| "package"
	| "product"
	| "consulting";

export interface CatalogCategory {
	id?: string;
	name: string;
	slug: string;
	description?: string;
	iconKey?: string;
	color: string;
}

export interface CatalogTier {
	id?: string;
	name: string;
	slug: string;
	description?: string;
	color: string;
}

export interface CatalogBadge {
	id?: string;
	name: string;
	slug: string;
	iconKey?: string;
	textColor: string;
	backgroundColor: string;
	borderColor: string;
}

export interface ServiceItem {
	title: string;
	description: string;
	features?: string[];
	badge?: string;
}

export interface PricingItem {
	id?: string;

	name: string;
	description: string;

	itemKind?: CatalogItemKind;

	price?: number | null;
	compareAtPrice?: number | null;

	pricePrefix?: string;
	priceLabel?: string;
	priceSuffix?: string;

	features?: string[];

	category?: CatalogCategory;
	tier?: CatalogTier;
	badges?: CatalogBadge[];

	/**
	 * Campo legado mantido durante a migração.
	 * O catálogo público atual ainda pode utilizá-lo
	 * até a nova interface visual entrar em produção.
	 */
	badge?: string;

	featured?: boolean;
	note?: string;

	ctaLabel?: string;
	ctaMessage?: string;
}

export interface ServicePageConfig {
	division: ServiceDivision;

	seo: {
		title: string;
		description: string;
		canonical: string;
	};

	theme: {
		accent: string;
		accentSecondary: string;
	};

	hero: {
		eyebrow: string;
		title: string;
		description: string;
		highlights: string[];
		primaryLabel?: string;
		primaryMessage: string;
		secondaryLabel?: string;
		secondaryHref?: string;
	};

	servicesSection: {
		eyebrow?: string;
		title: string;
		description: string;
	};

	services: ServiceItem[];

	pricingSection: {
		eyebrow?: string;
		title: string;
		description: string;
		disclaimer?: string;
	};

	pricing: PricingItem[];

	cta: {
		eyebrow: string;
		title: string;
		description: string;
		buttonLabel: string;
		message: string;
		secondaryLabel?: string;
		secondaryHref?: string;
	};
}
