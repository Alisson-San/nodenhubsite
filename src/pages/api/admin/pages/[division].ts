import type {
	APIRoute,
} from "astro";

import type {
	TablesUpdate,
} from "../../../../types/database.types";

import {
	createSupabaseRequestClient,
} from "../../../../lib/supabase/request";

import {
	isServiceDivision,
} from "../../../../lib/admin/divisions";

export const prerender = false;

const colorPattern =
	/^#[0-9a-fA-F]{6}$/;

const canonicalPattern =
	/^\/(?:[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\/?)*$/;

function hasValidOrigin(
	request: Request,
): boolean {
	const origin =
		request.headers.get("Origin");

	if (!origin) {
		return false;
	}

	try {
		return (
			new URL(origin).origin ===
			new URL(request.url).origin
		);
	} catch {
		return false;
	}
}

function readText(
	formData: FormData,
	name: string,
): string {
	return String(
		formData.get(name) ?? "",
	).trim();
}

function optionalText(
	value: string,
): string | null {
	return value || null;
}

function parseLines(
	value: string,
): string[] {
	return value
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function hasMatchingOptionalPair(
	label: string,
	href: string,
): boolean {
	return Boolean(label) ===
		Boolean(href);
}

function isSafePublicHref(
	value: string,
): boolean {
	if (!value) {
		return true;
	}

	if (
		value.startsWith("#")
	) {
		return (
			value.length > 1 &&
			!/\s/.test(value)
		);
	}

	if (
		value.startsWith("/") &&
		!value.startsWith("//")
	) {
		return !/\s/.test(value);
	}

	try {
		const url =
			new URL(value);

		return (
			url.protocol === "https:" ||
			url.protocol === "http:" ||
			url.protocol === "mailto:" ||
			url.protocol === "tel:" ||
			url.protocol === "whatsapp:"
		);
	} catch {
		return false;
	}
}

function exceeds(
	value: string,
	maxLength: number,
): boolean {
	return value.length > maxLength;
}

export const POST: APIRoute =
	async (context) => {
		const division =
			context.params.division;

		if (
			!isServiceDivision(
				division,
			)
		) {
			return new Response(
				"Divisão inválida.",
				{
					status: 404,
				},
			);
		}

		if (
			!context.locals.user ||
			!context.locals.isAdmin
		) {
			return new Response(
				"Acesso negado.",
				{
					status: 403,
				},
			);
		}

		if (
			!hasValidOrigin(
				context.request,
			)
		) {
			return context.redirect(
				`/admin/pages/${division}?error=origin`,
				303,
			);
		}

		const formData =
			await context.request
				.formData();

		const values = {
			seoTitle:
				readText(
					formData,
					"seo_title",
				),

			seoDescription:
				readText(
					formData,
					"seo_description",
				),

			canonicalPath:
				readText(
					formData,
					"canonical_path",
				),

			accentColor:
				readText(
					formData,
					"accent_color",
				).toUpperCase(),

			accentSecondaryColor:
				readText(
					formData,
					"accent_secondary_color",
				).toUpperCase(),

			heroEyebrow:
				readText(
					formData,
					"hero_eyebrow",
				),

			heroTitle:
				readText(
					formData,
					"hero_title",
				),

			heroDescription:
				readText(
					formData,
					"hero_description",
				),

			heroPrimaryLabel:
				readText(
					formData,
					"hero_primary_label",
				),

			heroPrimaryMessage:
				readText(
					formData,
					"hero_primary_message",
				),

			heroSecondaryLabel:
				readText(
					formData,
					"hero_secondary_label",
				),

			heroSecondaryHref:
				readText(
					formData,
					"hero_secondary_href",
				),

			servicesEyebrow:
				readText(
					formData,
					"services_eyebrow",
				),

			servicesTitle:
				readText(
					formData,
					"services_title",
				),

			servicesDescription:
				readText(
					formData,
					"services_description",
				),

			pricingEyebrow:
				readText(
					formData,
					"pricing_eyebrow",
				),

			pricingTitle:
				readText(
					formData,
					"pricing_title",
				),

			pricingDescription:
				readText(
					formData,
					"pricing_description",
				),

			pricingDisclaimer:
				readText(
					formData,
					"pricing_disclaimer",
				),

			ctaEyebrow:
				readText(
					formData,
					"cta_eyebrow",
				),

			ctaTitle:
				readText(
					formData,
					"cta_title",
				),

			ctaDescription:
				readText(
					formData,
					"cta_description",
				),

			ctaButtonLabel:
				readText(
					formData,
					"cta_button_label",
				),

			ctaMessage:
				readText(
					formData,
					"cta_message",
				),

			ctaSecondaryLabel:
				readText(
					formData,
					"cta_secondary_label",
				),

			ctaSecondaryHref:
				readText(
					formData,
					"cta_secondary_href",
				),
		};

		const requiredValues = [
			values.seoTitle,
			values.seoDescription,
			values.canonicalPath,
			values.accentColor,
			values.accentSecondaryColor,
			values.heroEyebrow,
			values.heroTitle,
			values.heroDescription,
			values.heroPrimaryMessage,
			values.servicesTitle,
			values.servicesDescription,
			values.pricingTitle,
			values.pricingDescription,
			values.ctaEyebrow,
			values.ctaTitle,
			values.ctaDescription,
			values.ctaButtonLabel,
			values.ctaMessage,
		];

		const invalidLengths =
			exceeds(
				values.seoTitle,
				100,
			) ||
			exceeds(
				values.seoDescription,
				320,
			) ||
			exceeds(
				values.heroTitle,
				180,
			) ||
			exceeds(
				values.heroDescription,
				800,
			) ||
			exceeds(
				values.heroPrimaryMessage,
				1200,
			) ||
			exceeds(
				values.servicesTitle,
				180,
			) ||
			exceeds(
				values.servicesDescription,
				800,
			) ||
			exceeds(
				values.pricingTitle,
				180,
			) ||
			exceeds(
				values.pricingDescription,
				800,
			) ||
			exceeds(
				values.pricingDisclaimer,
				1200,
			) ||
			exceeds(
				values.ctaTitle,
				180,
			) ||
			exceeds(
				values.ctaDescription,
				800,
			) ||
			exceeds(
				values.ctaMessage,
				1200,
			);

		const isInvalid =
			requiredValues.some(
				(value) =>
					!value,
			) ||
			invalidLengths ||
			!canonicalPattern.test(
				values.canonicalPath,
			) ||
			!colorPattern.test(
				values.accentColor,
			) ||
			!colorPattern.test(
				values.accentSecondaryColor,
			) ||
			!hasMatchingOptionalPair(
				values.heroSecondaryLabel,
				values.heroSecondaryHref,
			) ||
			!hasMatchingOptionalPair(
				values.ctaSecondaryLabel,
				values.ctaSecondaryHref,
			) ||
			!isSafePublicHref(
				values.heroSecondaryHref,
			) ||
			!isSafePublicHref(
				values.ctaSecondaryHref,
			);

		if (isInvalid) {
			return context.redirect(
				`/admin/pages/${division}?error=validation`,
				303,
			);
		}

		const payload:
			TablesUpdate<"service_pages"> = {
			seo_title:
				values.seoTitle,

			seo_description:
				values.seoDescription,

			canonical_path:
				values.canonicalPath,

			accent_color:
				values.accentColor,

			accent_secondary_color:
				values.accentSecondaryColor,

			hero_eyebrow:
				values.heroEyebrow,

			hero_title:
				values.heroTitle,

			hero_description:
				values.heroDescription,

			hero_highlights:
				parseLines(
					readText(
						formData,
						"hero_highlights",
					),
				),

			hero_primary_label:
				optionalText(
					values.heroPrimaryLabel,
				),

			hero_primary_message:
				values.heroPrimaryMessage,

			hero_secondary_label:
				optionalText(
					values.heroSecondaryLabel,
				),

			hero_secondary_href:
				optionalText(
					values.heroSecondaryHref,
				),

			services_eyebrow:
				optionalText(
					values.servicesEyebrow,
				),

			services_title:
				values.servicesTitle,

			services_description:
				values.servicesDescription,

			pricing_eyebrow:
				optionalText(
					values.pricingEyebrow,
				),

			pricing_title:
				values.pricingTitle,

			pricing_description:
				values.pricingDescription,

			pricing_disclaimer:
				optionalText(
					values.pricingDisclaimer,
				),

			cta_eyebrow:
				values.ctaEyebrow,

			cta_title:
				values.ctaTitle,

			cta_description:
				values.ctaDescription,

			cta_button_label:
				values.ctaButtonLabel,

			cta_message:
				values.ctaMessage,

			cta_secondary_label:
				optionalText(
					values.ctaSecondaryLabel,
				),

			cta_secondary_href:
				optionalText(
					values.ctaSecondaryHref,
				),

			is_published:
				formData.get(
					"is_published",
				) === "true",

			updated_by:
				context.locals.user.id,
		};

		try {
			const supabase =
				createSupabaseRequestClient({
					request:
						context.request,

					cookies:
						context.cookies,
				});

			const {
				error,
			} = await supabase
				.from("service_pages")
				.update(payload)
				.eq(
					"division",
					division,
				);

			if (error) {
				if (
					error.code ===
						"23505"
				) {
					return context.redirect(
						`/admin/pages/${division}?error=duplicate`,
						303,
					);
				}

				throw error;
			}

			return context.redirect(
				`/admin/pages/${division}?saved=1`,
				303,
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha ao salvar página.",
				error,
			);

			return context.redirect(
				`/admin/pages/${division}?error=save`,
				303,
			);
		}
	};
