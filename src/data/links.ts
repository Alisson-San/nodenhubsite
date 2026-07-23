import {
	getWhatsAppUrl,
} from "../config/site";

import type {
	RuntimeSiteConfig,
} from "../types/site";

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

export function buildLinkItems(
	site: RuntimeSiteConfig,
): LinkItem[] {
	const phoneHref =
		`tel:${site.phone.replace(
			/[^\d+]/g,
			"",
		)}`;

	const instagram =
		site.socialLinks.find(
			(item) =>
				item.isActive &&
				item.platform ===
					"instagram",
		);

	const items: LinkItem[] = [
		{
			title: "Falar pelo WhatsApp",
			description:
				"Orçamentos, dúvidas e agendamentos",

			href: getWhatsAppUrl(
				"Olá! Vim pela página de links da Noden.",
				site,
			),

			icon: "whatsapp",
			external: true,
			featured: true,
		},
		{
			title: "Conhecer a Noden",
			description:
				"Acesse nosso site institucional",
			href: "/",
			icon: "website",
		},
	];

	if (instagram) {
		items.push({
			title: instagram.label,
			description:
				instagram.username ??
				instagram.label,
			href: instagram.url,
			icon: "instagram",
			external: true,
		});
	}

	items.push({
		title: "Ligar para a Noden",
		description: site.phone,
		href: phoneHref,
		icon: "phone",
	});

	return items;
}
