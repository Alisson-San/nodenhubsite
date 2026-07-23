export interface SiteSocialLink {
	id?: string;
	platform: string;
	label: string;
	url: string;
	username?: string;
	isActive: boolean;
	sortOrder: number;
}

export interface RuntimeSiteConfig {
	name: string;
	legalName: string;
	description: string;
	url: string;
	locale: string;

	phone: string;
	email: string;
	address: string;
	serviceHours: string;

	whatsapp: {
		phone: string;
		defaultMessage: string;
	};

	serviceAreas: string[];

	socials: Record<string, string>;
	socialLinks: SiteSocialLink[];
}
