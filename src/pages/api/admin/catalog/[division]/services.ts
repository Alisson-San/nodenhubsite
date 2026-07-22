import type {
	APIRoute,
} from "astro";

import type {
	TablesInsert,
	TablesUpdate,
} from "../../../../../types/database.types";

import {
	createSupabaseRequestClient,
} from "../../../../../lib/supabase/request";

import {
	isServiceDivision,
} from "../../../../../lib/admin/divisions";

export const prerender = false;

const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
	return value.length > 0
		? value
		: null;
}

function parseLines(
	value: string,
): string[] {
	return value
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function parseSortOrder(
	value: string,
): number | null {
	const parsed =
		Number.parseInt(
			value,
			10,
		);

	if (
		!Number.isInteger(parsed) ||
		parsed < 0
	) {
		return null;
	}

	return parsed;
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
				`/admin/catalog/${division}?error=origin`,
				303,
			);
		}

		const formData =
			await context.request
				.formData();

		const serviceId =
			readText(
				formData,
				"service_id",
			);

		const title =
			readText(
				formData,
				"title",
			);

		const description =
			readText(
				formData,
				"description",
			);

		const badge =
			optionalText(
				readText(
					formData,
					"badge",
				),
			);

		const features =
			parseLines(
				readText(
					formData,
					"features",
				),
			);

		const sortOrder =
			parseSortOrder(
				readText(
					formData,
					"sort_order",
				),
			);

		const isActive =
			formData.get(
				"is_active",
			) === "true";

		if (
			!title ||
			!description ||
			sortOrder === null
		) {
			return context.redirect(
				`/admin/catalog/${division}?error=validation`,
				303,
			);
		}

		if (
			serviceId &&
			!uuidPattern.test(
				serviceId,
			)
		) {
			return context.redirect(
				`/admin/catalog/${division}?error=not-found`,
				303,
			);
		}

		try {
			const supabase =
				createSupabaseRequestClient({
					request:
						context.request,

					cookies:
						context.cookies,
				});

			const {
				data: page,
				error: pageError,
			} = await supabase
				.from("service_pages")
				.select("id")
				.eq(
					"division",
					division,
				)
				.single();

			if (
				pageError ||
				!page
			) {
				throw pageError ??
					new Error(
						"Página não encontrada.",
					);
			}

			if (serviceId) {
				const payload:
					TablesUpdate<"services"> = {
					title,
					description,
					features,
					badge,
					sort_order:
						sortOrder,

					is_active:
						isActive,

					updated_by:
						context.locals
							.user.id,
				};

				const {
					data: updated,
					error,
				} = await supabase
					.from("services")
					.update(payload)
					.eq(
						"id",
						serviceId,
					)
					.eq(
						"service_page_id",
						page.id,
					)
					.select("id")
					.maybeSingle();

				if (error) {
					throw error;
				}

				if (!updated) {
					return context.redirect(
						`/admin/catalog/${division}?error=not-found`,
						303,
					);
				}

				return context.redirect(
					`/admin/catalog/${division}?saved=updated#services`,
					303,
				);
			}

			const payload:
				TablesInsert<"services"> = {
				service_page_id:
					page.id,

				title,
				description,
				features,
				badge,
				sort_order:
					sortOrder,

				is_active:
					isActive,

				updated_by:
					context.locals
						.user.id,
			};

			const {
				error,
			} = await supabase
				.from("services")
				.insert(payload);

			if (error) {
				throw error;
			}

			return context.redirect(
				`/admin/catalog/${division}?saved=created#services`,
				303,
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha ao salvar serviço.",
				error,
			);

			return context.redirect(
				`/admin/catalog/${division}?error=save`,
				303,
			);
		}
	};