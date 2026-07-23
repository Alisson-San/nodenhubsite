import type {
	APIRoute,
} from "astro";

import {
	createSupabaseRequestClient,
} from "../../../../../lib/supabase/request";

import {
	isServiceDivision,
} from "../../../../../lib/admin/divisions";

export const prerender = false;

type ItemType =
	| "service"
	| "pricing";

type ItemAction =
	| "move_up"
	| "move_down"
	| "delete";

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

function isItemType(
	value: string,
): value is ItemType {
	return (
		value === "service" ||
		value === "pricing"
	);
}

function isItemAction(
	value: string,
): value is ItemAction {
	return (
		value === "move_up" ||
		value === "move_down" ||
		value === "delete"
	);
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

		const formData =
			await context.request
				.formData();

		const itemType =
			readText(
				formData,
				"item_type",
			);

		const itemAction =
			readText(
				formData,
				"action",
			);

		const itemId =
			readText(
				formData,
				"item_id",
			);

		if (
			!isItemType(itemType) ||
			!isItemAction(itemAction) ||
			!uuidPattern.test(itemId)
		) {
			return new Response(
				"Solicitação inválida.",
				{
					status: 400,
				},
			);
		}

		const basePath =
			itemType === "service"
				? `/admin/catalog/${division}`
				: `/admin/catalog/${division}/prices`;

		const anchor =
			itemType === "service"
				? "#services"
				: "#pricing";

		const redirectWith =
			(query: string) =>
				context.redirect(
					`${basePath}?${query}${anchor}`,
					303,
				);

		if (
			!hasValidOrigin(
				context.request,
			)
		) {
			return redirectWith(
				"error=origin",
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

			if (itemType === "service") {
				const {
					data: item,
					error: itemError,
				} = await supabase
					.from("services")
					.select("id, title")
					.eq("id", itemId)
					.eq(
						"service_page_id",
						page.id,
					)
					.maybeSingle();

				if (itemError) {
					throw itemError;
				}

				if (!item) {
					return redirectWith(
						"error=not-found",
					);
				}

				if (itemAction === "delete") {
					const confirmation =
						readText(
							formData,
							"confirm_value",
						);

					if (
						confirmation !==
						item.title
					) {
						return redirectWith(
							"error=confirmation",
						);
					}

					const {
						data: deleted,
						error,
					} = await supabase
						.from("services")
						.delete()
						.eq("id", item.id)
						.eq(
							"service_page_id",
							page.id,
						)
						.select("id")
						.maybeSingle();

					if (error) {
						throw error;
					}

					if (!deleted) {
						return redirectWith(
							"error=not-found",
						);
					}

					return redirectWith(
						"saved=deleted",
					);
				}

				const direction =
					itemAction === "move_up"
						? -1
						: 1;

				const {
					data: moved,
					error,
				} = await supabase.rpc(
					"move_service_item",
					{
						p_item_id:
							item.id,

						p_direction:
							direction,
					},
				);

				if (error) {
					throw error;
				}

				if (!moved) {
					return redirectWith(
						"error=not-found",
					);
				}

				return redirectWith(
					"saved=moved",
				);
			}

			const {
				data: item,
				error: itemError,
			} = await supabase
				.from("pricing_items")
				.select("id, name")
				.eq("id", itemId)
				.eq(
					"service_page_id",
					page.id,
				)
				.maybeSingle();

			if (itemError) {
				throw itemError;
			}

			if (!item) {
				return redirectWith(
					"error=not-found",
				);
			}

			if (itemAction === "delete") {
				const confirmation =
					readText(
						formData,
						"confirm_value",
					);

				if (
					confirmation !==
					item.name
				) {
					return redirectWith(
						"error=confirmation",
					);
				}

				const {
					data: deleted,
					error,
				} = await supabase
					.from("pricing_items")
					.delete()
					.eq("id", item.id)
					.eq(
						"service_page_id",
						page.id,
					)
					.select("id")
					.maybeSingle();

				if (error) {
					throw error;
				}

				if (!deleted) {
					return redirectWith(
						"error=not-found",
					);
				}

				return redirectWith(
					"saved=deleted",
				);
			}

			const direction =
				itemAction === "move_up"
					? -1
					: 1;

			const {
				data: moved,
				error,
			} = await supabase.rpc(
				"move_pricing_item",
				{
					p_item_id:
						item.id,

					p_direction:
						direction,
				},
			);

			if (error) {
				throw error;
			}

			if (!moved) {
				return redirectWith(
					"error=not-found",
				);
			}

			return redirectWith(
				"saved=moved",
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha na ação do catálogo.",
				error,
			);

			return redirectWith(
				"error=action",
			);
		}
	};