import type {
	RuntimeSiteConfig,
} from "../types/site";

export const siteConfig:
	RuntimeSiteConfig = {
	name: "Noden",

	legalName:
		"Noden Technology Hub",

	description:
		"Noden Technology Hub — suporte residencial, performance gamer e soluções em software e dados.",

	url: "https://nodenhub.com.br",
	locale: "pt-BR",

	phone: "+55 54 99630-6632",
	email: "",
	address: "",

	serviceHours:
		"Atendimento mediante agendamento",

	whatsapp: {
		phone: "5554996306632",

		defaultMessage:
			"Olá! Vim pelo site da Noden.",
	},

	serviceAreas: [
		"Barão",
		"Carlos Barbosa",
		"Salvador do Sul",
		"São Pedro da Serra",
	],

	socials: {
		instagram:
			"https://instagram.com/noden.hub",
		facebook: "",
		telegram: "",
	},

	socialLinks: [
		{
			platform: "instagram",
			label: "Instagram",

			url:
				"https://instagram.com/noden.hub",

			username: "@noden.hub",
			isActive: true,
			sortOrder: 0,
		},
		{
			platform: "whatsapp",
			label: "WhatsApp",

			url:
				"https://wa.me/5554996306632",

			username:
				"+55 54 99630-6632",

			isActive: true,
			sortOrder: 1,
		},
		{
			platform: "website",
			label: "Site",

			url:
				"https://nodenhub.com.br",

			username:
				"nodenhub.com.br",

			isActive: true,
			sortOrder: 2,
		},
	],
};

export function getWhatsAppUrl(
	message?: string,
	config:
		RuntimeSiteConfig = siteConfig,
): string {
	const resolvedMessage =
		message ??
		config.whatsapp.defaultMessage;

	return `whatsapp://send?phone=${config.whatsapp.phone}&text=${encodeURIComponent(
		resolvedMessage,
	)}`;
}
