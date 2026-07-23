import type {
	APIRoute,
} from "astro";

import type {
	Database,
} from "../../../../../types/database.types";

import {
	createSupabaseRequestClient,
} from "../../../../../lib/supabase/request";

import {
	isServiceDivision,
} from "../../../../../lib/admin/divisions";

import {
	isCatalogItemKind,
	isPriceType,
	priceRequiresValue,
} from "../../../../../lib/admin/pricing";

export const prerender = false;

const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type GeneratedSavePricingArgs =
	Database["public"]["Functions"]["save_pricing_catalog_item"]["Args"];

type SavePricingArgs =
	Omit<
		GeneratedSavePricingArgs,
		| "p_pricing_id"
		| "p_price"
		| "p_compare_at_price"
		| "p_price_prefix"
		| "p_price_label"
		| "p_price_suffix"
		| "p_category_id"
		| "p_tier_id"
		| "p_note"
		| "p_cta_label"
		| "p_cta_message"
	> & {
		p_pricing_id:
			string | null;

		p_price:
			number | null;

		p_compare_at_price:
			number | null;

		p_price_prefix:
			string | null;

		p_price_label:
			string | null;

		p_price_suffix:
			string | null;

		p_category_id:
			string | null;

		p_tier_id:
			string | null;

		p_note:
			string | null;

		p_cta_label:
			string | null;

		p_cta_message:
			string | null;
	};

function hasValidOrigin(request: Request): boolean {
	const origin = request.headers.get("Origin");
	if (!origin) return false;
	try {
		return new URL(origin).origin === new URL(request.url).origin;
	} catch {
		return false;
	}
}

function readText(formData: FormData, name: string): string {
	return String(formData.get(name) ?? "").trim();
}

function optionalText(value: string): string | null {
	return value.length > 0 ? value : null;
}

function parseLines(value: string): string[] {
	return value.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
}

function parseSortOrder(value: string): number | null {
	const parsed = Number.parseInt(value, 10);
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parsePrice(value: string): number | null {
	const cleaned = value.replace(/R\$/gi, "").replace(/\s/g, "");
	if (!cleaned) return null;
	const normalized = cleaned.includes(",")
		? cleaned.replace(/\./g, "").replace(",", ".")
		: cleaned;
	const parsed = Number(normalized);
	if (!Number.isFinite(parsed) || parsed < 0) return null;
	return Math.round(parsed * 100) / 100;
}

function optionalUuid(value: string): string | null | undefined {
	if (!value) return null;
	return uuidPattern.test(value) ? value : undefined;
}

export const POST: APIRoute = async (context) => {
	const division = context.params.division;
	if (!isServiceDivision(division)) {
		return new Response("Divisão inválida.", { status: 404 });
	}

	if (!context.locals.user || !context.locals.isAdmin) {
		return new Response("Acesso negado.", { status: 403 });
	}

	const redirectWith = (query: string) =>
		context.redirect(`/admin/catalog/${division}/prices?${query}#pricing`, 303);

	if (!hasValidOrigin(context.request)) return redirectWith("error=origin");

	const formData = await context.request.formData();
	const pricingId = readText(formData, "pricing_id");
	const name = readText(formData, "name");
	const description = readText(formData, "description");
	const rawPriceType = readText(formData, "price_type");
	const rawItemKind = readText(formData, "item_kind");
	const sortOrder = parseSortOrder(readText(formData, "sort_order"));
	const categoryId = optionalUuid(readText(formData, "category_id"));
	const tierId = optionalUuid(readText(formData, "tier_id"));
	const badgeIds = [...new Set(formData.getAll("badge_ids").map((value) => String(value).trim()))];

	if (
		!name || name.length > 140 ||
		!description || description.length > 1200 ||
		!isPriceType(rawPriceType) ||
		!isCatalogItemKind(rawItemKind) ||
		sortOrder === null ||
		categoryId === undefined ||
		tierId === undefined ||
		badgeIds.some((id) => !uuidPattern.test(id)) ||
		(pricingId && !uuidPattern.test(pricingId))
	) {
		return redirectWith("error=validation");
	}

	const priceType = rawPriceType;
	const rawPrice = readText(formData, "price");
	const parsedPrice = parsePrice(rawPrice);
	if (priceRequiresValue(priceType) && (!rawPrice || parsedPrice === null)) {
		return redirectWith("error=validation");
	}

	const rawComparePrice = readText(formData, "compare_at_price");
	const compareAtPrice = parsePrice(rawComparePrice);
	if (rawComparePrice && (compareAtPrice === null || parsedPrice === null || compareAtPrice <= parsedPrice)) {
		return redirectWith("error=promotion");
	}

	try {
		const supabase = createSupabaseRequestClient({ request: context.request, cookies: context.cookies });
		const { data: page, error: pageError } = await supabase
			.from("service_pages")
			.select("id")
			.eq("division", division)
			.single();

		if (pageError || !page) throw pageError ?? new Error("Página não encontrada.");

		const rpcArgs = {
			p_pricing_id:
				pricingId ||
				null,

			p_service_page_id:
				page.id,

			p_name:
				name,

			p_description:
				description,

			p_price_type:
				priceType,

			p_price:
				priceRequiresValue(
					priceType,
				)
					? parsedPrice
					: null,

			p_compare_at_price:
				rawComparePrice
					? compareAtPrice
					: null,

			p_price_prefix:
				optionalText(
					readText(
						formData,
						"price_prefix",
					),
				),

			p_price_label:
				optionalText(
					readText(
						formData,
						"price_label",
					),
				),

			p_price_suffix:
				optionalText(
					readText(
						formData,
						"price_suffix",
					),
				),

			p_features:
				parseLines(
					readText(
						formData,
						"features",
					),
				),

			p_category_id:
				categoryId,

			p_tier_id:
				tierId,

			p_item_kind:
				rawItemKind,

			p_note:
				optionalText(
					readText(
						formData,
						"note",
					),
				),

			p_is_featured:
				formData.get(
					"is_featured",
				) === "true",

			p_is_active:
				formData.get(
					"is_active",
				) === "true",

			p_sort_order:
				sortOrder,

			p_cta_label:
				optionalText(
					readText(
						formData,
						"cta_label",
					),
				),

			p_cta_message:
				optionalText(
					readText(
						formData,
						"cta_message",
					),
				),

			p_badge_ids:
				badgeIds,

			p_updated_by:
				context.locals.user.id,
		} satisfies SavePricingArgs;

		const {
			data: savedId,
			error,
		} = await supabase.rpc(
			"save_pricing_catalog_item",

			rpcArgs as unknown as
				GeneratedSavePricingArgs,
		);

		if (error) {
			if (error.code === "P0002") return redirectWith("error=not-found");
			if (error.code === "22023" || error.code === "23503") return redirectWith("error=validation");
			throw error;
		}

		if (!savedId) throw new Error("Item não salvo.");
		return redirectWith(pricingId ? "saved=updated" : "saved=created");
	} catch (error) {
		console.error("[Noden Admin] Falha ao salvar item do catálogo.", error);
		return redirectWith("error=save");
	}
};
