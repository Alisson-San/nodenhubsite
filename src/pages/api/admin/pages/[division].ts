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

function parseLines(
	value: string,
): string[] {
	return value
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter(Boolean);
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

		const seoTitle =
			readText(
				formData,
				"seo_title",
			);

		const seoDescription =
			readText(
				formData,
				"seo_description",
			);

		const heroEyebrow =
			readText(
				formData,
				"hero_eyebrow",
			);

		const heroTitle =
			readText(
				formData,
				"hero_title",
			);

		const heroDescription =
			readText(
				formData,
				"hero_description",
			);

		if (
			!seoTitle ||
			!seoDescription ||
			!heroEyebrow ||
			!heroTitle ||
			!heroDescription
		) {
			return context.redirect(
				`/admin/pages/${division}?error=validation`,
				303,
			);
		}

		const payload:
			TablesUpdate<"service_pages"> = {
			seo_title:
				seoTitle,

			seo_description:
				seoDescription,

			hero_eyebrow:
				heroEyebrow,

			hero_title:
				heroTitle,

			hero_description:
				heroDescription,

			hero_highlights:
				parseLines(
					readText(
						formData,
						"hero_highlights",
					),
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