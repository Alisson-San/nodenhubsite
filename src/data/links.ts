import {
	getWhatsAppUrl,
	siteConfig,
} from "../config/site";

export type LinkIcon =
	| "whatsapp"
	| "website"
	| "instagram"
	| "phone";

export interface LinkItem {
	title: string;
	description: string;
	href: string;
	icon: LinkIcon;
	external?: boolean;
	featured?: boolean;
}

const phoneHref = `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`;

export const linkItems: LinkItem[] = [
	{
		title: "Falar pelo WhatsApp",
		description: "Orçamentos, dúvidas e agendamentos",
		href: getWhatsAppUrl(
			"Olá! Vim pela página de links da Noden.",
		),
		icon: "whatsapp",
		external: true,
		featured: true,
	},
	{
		title: "Conhecer a Noden",
		description: "Acesse nosso site institucional",
		href: "/",
		icon: "website",
	},
	{
		title: "Instagram",
		description: "@noden.hub",
		href: siteConfig.socials.instagram,
		icon: "instagram",
		external: true,
	},
	{
		title: "Ligar para a Noden",
		description: siteConfig.phone,
		href: phoneHref,
		icon: "phone",
	},
];