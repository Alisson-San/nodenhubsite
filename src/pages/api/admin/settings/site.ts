import type {
	APIRoute,
} from "astro";

import type {
	Json,
	TablesInsert,
} from "../../../../types/database.types";

import {
	createSupabaseRequestClient,
} from "../../../../lib/supabase/request";

export const prerender = false;

function hasValidOrigin(
	request: Request,
): boolean {
	const origin =
		request.headers.get(
			"Origin",
		);

	if (!origin) {
		return false;
	}

	try {
		return (
			new URL(origin).origin ===
			new URL(
				request.url,
			).origin
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

function normalizeUrl(
	value: string,
): string | null {
	try {
		const url =
			new URL(value);

		if (
			url.protocol !==
				"http:" &&
			url.protocol !==
				"https:"
		) {
			return null;
		}

		return url
			.toString()
			.replace(/\/$/, "");
	} catch {
		return null;
	}
}

function parseAreas(
	value: string,
): string[] {
	const seen =
		new Set<string>();

	return value
		.split(/\r?\n/)
		.map(
			(item) =>
				item.trim(),
		)
		.filter(Boolean)
		.filter((item) => {
			const normalized =
				item.toLocaleLowerCase(
					"pt-BR",
				);

			if (
				seen.has(
					normalized,
				)
			) {
				return false;
			}

			seen.add(normalized);
			return true;
		});
}

export const POST:
	APIRoute =
	async (context) => {
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
				"/admin/settings?error=origin",
				303,
			);
		}

		const formData =
			await context.request
				.formData();

		const name =
			readText(
				formData,
				"name",
			);

		const legalName =
			readText(
				formData,
				"legal_name",
			);

		const description =
			readText(
				formData,
				"description",
			);

		const siteUrl =
			normalizeUrl(
				readText(
					formData,
					"site_url",
				),
			);

		const locale =
			readText(
				formData,
				"locale",
			);

		const phone =
			readText(
				formData,
				"phone",
			);

		const email =
			readText(
				formData,
				"email",
			);

		const address =
			readText(
				formData,
				"address",
			);

		const serviceHours =
			readText(
				formData,
				"service_hours",
			);

		const whatsappPhone =
			readText(
				formData,
				"whatsapp_phone",
			).replace(/\D/g, "");

		const whatsappMessage =
			readText(
				formData,
				"whatsapp_message",
			);

		const serviceAreas =
			parseAreas(
				readText(
					formData,
					"service_areas",
				),
			);

		const validEmail =
			!email ||
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
				email,
			);

		const validLocale =
			/^[a-z]{2}(?:-[A-Z]{2})?$/.test(
				locale,
			);

		if (
			!name ||
			!legalName ||
			!description ||
			!siteUrl ||
			!validLocale ||
			!phone ||
			!serviceHours ||
			!whatsappMessage ||
			!validEmail ||
			whatsappPhone.length < 10 ||
			whatsappPhone.length > 15 ||
			serviceAreas.length === 0
		) {
			return context.redirect(
				"/admin/settings?error=validation",
				303,
			);
		}

		const identity:
			Json = {
			name,
			legalName,
			description,
			url: siteUrl,
			locale,
		};

		const contact:
			Json = {
			phone,
			email,
			address,
			serviceHours,

			whatsapp: {
				phone:
					whatsappPhone,

				defaultMessage:
					whatsappMessage,
			},
		};

		const areas:
			Json = {
			items:
				serviceAreas,
		};

		const payload:
			Array<
				TablesInsert<
					"site_settings"
				>
			> = [
			{
				key:
					"site.identity",

				value:
					identity,

				description:
					"Identidade e informações institucionais da Noden.",

				is_public:
					true,

				updated_by:
					context.locals
						.user.id,
			},
			{
				key:
					"site.contact",

				value:
					contact,

				description:
					"Dados públicos de contato.",

				is_public:
					true,

				updated_by:
					context.locals
						.user.id,
			},
			{
				key:
					"site.service_areas",

				value:
					areas,

				description:
					"Municípios e regiões atendidas.",

				is_public:
					true,

				updated_by:
					context.locals
						.user.id,
			},
		];

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
				.from("site_settings")
				.upsert(
					payload,
					{
						onConflict:
							"key",
					},
				);

			if (error) {
				throw error;
			}

			return context.redirect(
				"/admin/settings?saved=site",
				303,
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha ao salvar configurações.",
				error,
			);

			return context.redirect(
				"/admin/settings?error=save",
				303,
			);
		}
	};
