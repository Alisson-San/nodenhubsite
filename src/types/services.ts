export type ServiceDivision =
	| "home"
	| "game"
	| "data";

export interface ServiceItem {
	title: string;
	description: string;
	features?: string[];
	badge?: string;
}

export interface PricingItem {
	name: string;
	description: string;
	price?: number | null;
	pricePrefix?: string;
	priceLabel?: string;
	priceSuffix?: string;
	features?: string[];
	featured?: boolean;
	badge?: string;
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