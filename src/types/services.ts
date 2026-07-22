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