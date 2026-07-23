import {
	siteConfig as fallbackSiteConfig,
} from "../../config/site";

import type {
	Json,
	Tables,
} from "../../types/database.types";

import type {
	RuntimeSiteConfig,
	SiteSocialLink,
} from "../../types/site";

import {
	createSupabaseServerClient,
} from "../supabase/server";

export const siteSettingKeys = [
	"site.identity",
	"site.contact",
	"site.service_areas",
] as const;

type SettingRow = Pick<
	Tables<"site_settings">,
	"key" | "value"
>;

type SocialRow = Pick<
	Tables<"social_links">,
	| "id"
	| "platform"
	| "label"
	| "url"
	| "username"
	| "is_active"
	| "sort_order"
>;

type JsonObject = {
	[key: string]:
		| Json
		| undefined;
};

function asObject(
	value: Json | undefined,
): JsonObject | undefined {
	if (
		typeof value !== "object" ||
		value === null ||
		Array.isArray(value)
	) {
		return undefined;
	}

	return value;
}

function readString(
	source: JsonObject | undefined,
	key: string,
	fallback: string,
): string {
	const value = source?.[key];

	return typeof value === "string"
		? value
		: fallback;
}

function readObject(
	source: JsonObject | undefined,
	key: string,
): JsonObject | undefined {
	return asObject(
		source?.[key],
	);
}

function readStringArray(
	source: JsonObject | undefined,
	key: string,
	fallback: string[],
): string[] {
	const value = source?.[key];

	if (!Array.isArray(value)) {
		return fallback;
	}

	return value.filter(
		(item): item is string =>
			typeof item === "string",
	);
}

export function buildSiteConfig(
	settingRows: SettingRow[],
	socialRows: SocialRow[],
): RuntimeSiteConfig {
	const settings =
		new Map(
			settingRows.map(
				(row) => [
					row.key,
					asObject(row.value),
				],
			),
		);

	const identity =
		settings.get(
			"site.identity",
		);

	const contact =
		settings.get(
			"site.contact",
		);

	const serviceAreas =
		settings.get(
			"site.service_areas",
		);

	const whatsapp =
		readObject(
			contact,
			"whatsapp",
		);

	const socialLinks:
		SiteSocialLink[] =
			socialRows.map(
				(row) => ({
					id: row.id,

					platform:
						row.platform,

					label:
						row.label,

					url:
						row.url,

					username:
						row.username ??
						undefined,

					isActive:
						row.is_active,

					sortOrder:
						row.sort_order,
				}),
			);

	const socials:
		Record<string, string> = {};

	for (
		const social of
			socialLinks
	) {
		if (social.isActive) {
			socials[
				social.platform
			] = social.url;
		}
	}

	return {
		name:
			readString(
				identity,
				"name",
				fallbackSiteConfig.name,
			),

		legalName:
			readString(
				identity,
				"legalName",
				fallbackSiteConfig
					.legalName,
			),

		description:
			readString(
				identity,
				"description",
				fallbackSiteConfig
					.description,
			),

		url:
			readString(
				identity,
				"url",
				fallbackSiteConfig.url,
			),

		locale:
			readString(
				identity,
				"locale",
				fallbackSiteConfig
					.locale,
			),

		phone:
			readString(
				contact,
				"phone",
				fallbackSiteConfig
					.phone,
			),

		email:
			readString(
				contact,
				"email",
				fallbackSiteConfig
					.email,
			),

		address:
			readString(
				contact,
				"address",
				fallbackSiteConfig
					.address,
			),

		serviceHours:
			readString(
				contact,
				"serviceHours",
				fallbackSiteConfig
					.serviceHours,
			),

		whatsapp: {
			phone:
				readString(
					whatsapp,
					"phone",
					fallbackSiteConfig
						.whatsapp.phone,
				),

			defaultMessage:
				readString(
					whatsapp,
					"defaultMessage",
					fallbackSiteConfig
						.whatsapp
						.defaultMessage,
				),
		},

		serviceAreas:
			readStringArray(
				serviceAreas,
				"items",
				fallbackSiteConfig
					.serviceAreas,
			),

		socials,
		socialLinks,
	};
}

export async function loadSiteConfig():
	Promise<RuntimeSiteConfig> {
	try {
		const supabase =
			createSupabaseServerClient();

		const [
			settingsResult,
			socialResult,
		] = await Promise.all([
			supabase
				.from("site_settings")
				.select("key, value")
				.in(
					"key",
					[
						...siteSettingKeys,
					],
				)
				.eq(
					"is_public",
					true,
				),

			supabase
				.from("social_links")
				.select(`
					id,
					platform,
					label,
					url,
					username,
					is_active,
					sort_order
				`)
				.eq(
					"is_active",
					true,
				)
				.order(
					"sort_order",
					{
						ascending:
							true,
					},
				),
		]);

		if (
			settingsResult.error
		) {
			throw settingsResult
				.error;
		}

		if (socialResult.error) {
			throw socialResult
				.error;
		}

		return buildSiteConfig(
			settingsResult.data ??
				[],

			socialResult.data ??
				[],
		);
	} catch (error) {
		console.error(
			"[Noden] Configurações públicas indisponíveis. Usando fallback.",
			error,
		);

		return fallbackSiteConfig;
	}
}
