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

import {
	isPriceType,
	priceRequiresValue,
} from "../../../../../lib/admin/pricing";

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
		.map((entry) =>
			entry.trim(),
		)
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

function parsePrice(
	value: string,
): number | null {
	const cleaned = value
		.replace(/R\$/gi, "")
		.replace(/\s/g, "");

	if (!cleaned) {
		return null;
	}

	const normalized =
		cleaned.includes(",")
			? cleaned
					.replace(/\./g, "")
					.replace(",", ".")
			: cleaned;

	const parsed =
		Number(normalized);

	if (
		!Number.isFinite(parsed) ||
		parsed < 0
	) {
		return null;
	}

	return Math.round(
		parsed * 100,
	) / 100;
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
				`/admin/catalog/${division}/prices?error=origin`,
				303,
			);
		}

		const formData =
			await context.request
				.formData();

		const pricingId =
			readText(
				formData,
				"pricing_id",
			);

		const name =
			readText(
				formData,
				"name",
			);

		const description =
			readText(
				formData,
				"description",
			);

		const rawPriceType =
			readText(
				formData,
				"price_type",
			);

		const sortOrder =
			parseSortOrder(
				readText(
					formData,
					"sort_order",
				),
			);

		if (
			!name ||
			!description ||
			!isPriceType(
				rawPriceType,
			) ||
			sortOrder === null
		) {
			return context.redirect(
				`/admin/catalog/${division}/prices?error=validation`,
				303,
			);
		}

		const priceType =
			rawPriceType;

		const parsedPrice =
			parsePrice(
				readText(
					formData,
					"price",
				),
			);

		if (
			priceRequiresValue(
				priceType,
			) &&
			parsedPrice === null
		) {
			return context.redirect(
				`/admin/catalog/${division}/prices?error=validation`,
				303,
			);
		}

		if (
			pricingId &&
			!uuidPattern.test(
				pricingId,
			)
		) {
			return context.redirect(
				`/admin/catalog/${division}/prices?error=not-found`,
				303,
			);
		}

		const commonPayload = {
			name,
			description,

			price_type:
				priceType,

			price:
				priceRequiresValue(
					priceType,
				)
					? parsedPrice
					: null,

			price_prefix:
				optionalText(
					readText(
						formData,
						"price_prefix",
					),
				),

			price_label:
				optionalText(
					readText(
						formData,
						"price_label",
					),
				),

			price_suffix:
				optionalText(
					readText(
						formData,
						"price_suffix",
					),
				),

			features:
				parseLines(
					readText(
						formData,
						"features",
					),
				),

			badge:
				optionalText(
					readText(
						formData,
						"badge",
					),
				),

			note:
				optionalText(
					readText(
						formData,
						"note",
					),
				),

			cta_label:
				optionalText(
					readText(
						formData,
						"cta_label",
					),
				),

			cta_message:
				optionalText(
					readText(
						formData,
						"cta_message",
					),
				),

			is_featured:
				formData.get(
					"is_featured",
				) === "true",

			is_active:
				formData.get(
					"is_active",
				) === "true",

			sort_order:
				sortOrder,

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

			if (pricingId) {
				const payload:
					TablesUpdate<"pricing_items"> = {
					...commonPayload,
				};

				const {
					data: updated,
					error,
				} = await supabase
					.from("pricing_items")
					.update(payload)
					.eq(
						"id",
						pricingId,
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
						`/admin/catalog/${division}/prices?error=not-found`,
						303,
					);
				}

				return context.redirect(
					`/admin/catalog/${division}/prices?saved=updated#pricing`,
					303,
				);
			}

			const payload:
				TablesInsert<"pricing_items"> = {
				...commonPayload,

				service_page_id:
					page.id,
			};

			const {
				error,
			} = await supabase
				.from("pricing_items")
				.insert(payload);

			if (error) {
				throw error;
			}

			return context.redirect(
				`/admin/catalog/${division}/prices?saved=created#pricing`,
				303,
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha ao salvar preço.",
				error,
			);

			return context.redirect(
				`/admin/catalog/${division}/prices?error=save`,
				303,
			);
		}
	};