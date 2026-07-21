export const siteConfig = {
	name: "Noden",
	legalName: "Noden Technology Hub",

	description:
		"Noden Technology Hub — suporte residencial, performance gamer e soluções em software e dados.",

	url: "https://nodenhub.com.br",
	locale: "pt-BR",

	phone: "+55 54 99630-6632",

	whatsapp: {
		phone: "5554996306632",
		defaultMessage: "Olá! Vim pelo site da Noden.",
	},

	socials: {
		instagram: "https://instagram.com/noden.hub",
		facebook: "",
		telegram: "",
	},

	serviceAreas: [
		"Barão",
		"Carlos Barbosa",
		"Salvador do Sul",
		"São Pedro da Serra",
	],
} as const;

export function getWhatsAppUrl(
	message = siteConfig.whatsapp.defaultMessage,
) {
	return `https://wa.me/${siteConfig.whatsapp.phone}?text=${encodeURIComponent(
		message,
	)}`;
}