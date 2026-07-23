import type {
	APIRoute,
} from "astro";

import {
	createSupabaseRequestClient,
} from "../../../../../lib/supabase/request";

import type {
	TaxonomyEntityType,
} from "../../../../../lib/admin/catalogTaxonomy";

export const prerender = false;

type TaxonomyAction =
	| "move_up"
	| "move_down"
	| "delete";

const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function isEntityType(
	value: string,
): value is TaxonomyEntityType {
	return (
		value === "category" ||
		value === "tier" ||
		value === "badge"
	);
}

function isAction(
	value: string,
): value is TaxonomyAction {
	return (
		value === "move_up" ||
		value === "move_down" ||
		value === "delete"
	);
}

function redirectWith(
	context:
		Parameters<APIRoute>[0],
	entityType:
		TaxonomyEntityType,
	query: string,
): Response {
	const anchor =
		entityType === "category"
			? "categories"
			: entityType === "tier"
				? "tiers"
				: "badges";

	return context.redirect(
		`/admin/catalog/taxonomy?${query}#${anchor}`,
		303,
	);
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

		const formData =
			await context.request
				.formData();

		const entityType =
			readText(
				formData,
				"entity_type",
			);

		const action =
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
			!isEntityType(
				entityType,
			) ||
			!isAction(action) ||
			!uuidPattern.test(
				itemId,
			)
		) {
			return new Response(
				"Solicitação inválida.",
				{
					status: 400,
				},
			);
		}

		if (
			!hasValidOrigin(
				context.request,
			)
		) {
			return redirectWith(
				context,
				entityType,
				"error=origin",
			);
		}

		const supabase =
			createSupabaseRequestClient({
				request:
					context.request,

				cookies:
					context.cookies,
			});

		try {
			const direction =
				action === "move_up"
					? -1
					: 1;

			if (
				entityType ===
					"category"
			) {
				const {
					data: item,
					error: itemError,
				} = await supabase
					.from(
						"catalog_categories",
					)
					.select("id, name")
					.eq(
						"id",
						itemId,
					)
					.maybeSingle();

				if (itemError) {
					throw itemError;
				}

				if (!item) {
					return redirectWith(
						context,
						entityType,
						"error=not-found",
					);
				}

				if (action === "delete") {
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
							context,
							entityType,
							"error=confirmation",
						);
					}

					const {
						data,
						error,
					} = await supabase
						.from(
							"catalog_categories",
						)
						.delete()
						.eq(
							"id",
							item.id,
						)
						.select("id")
						.maybeSingle();

					if (error) {
						throw error;
					}

					if (!data) {
						return redirectWith(
							context,
							entityType,
							"error=not-found",
						);
					}

					return redirectWith(
						context,
						entityType,
						"saved=category-deleted",
					);
				}

				const {
					data,
					error,
				} = await supabase.rpc(
					"move_catalog_category",
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

				if (!data) {
					return redirectWith(
						context,
						entityType,
						"error=not-found",
					);
				}

				return redirectWith(
					context,
					entityType,
					"saved=category-moved",
				);
			}

			if (
				entityType === "tier"
			) {
				const {
					data: item,
					error: itemError,
				} = await supabase
					.from(
						"catalog_tiers",
					)
					.select("id, name")
					.eq(
						"id",
						itemId,
					)
					.maybeSingle();

				if (itemError) {
					throw itemError;
				}

				if (!item) {
					return redirectWith(
						context,
						entityType,
						"error=not-found",
					);
				}

				if (action === "delete") {
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
							context,
							entityType,
							"error=confirmation",
						);
					}

					const {
						data,
						error,
					} = await supabase
						.from(
							"catalog_tiers",
						)
						.delete()
						.eq(
							"id",
							item.id,
						)
						.select("id")
						.maybeSingle();

					if (error) {
						throw error;
					}

					if (!data) {
						return redirectWith(
							context,
							entityType,
							"error=not-found",
						);
					}

					return redirectWith(
						context,
						entityType,
						"saved=tier-deleted",
					);
				}

				const {
					data,
					error,
				} = await supabase.rpc(
					"move_catalog_tier",
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

				if (!data) {
					return redirectWith(
						context,
						entityType,
						"error=not-found",
					);
				}

				return redirectWith(
					context,
					entityType,
					"saved=tier-moved",
				);
			}

			const {
				data: item,
				error: itemError,
			} = await supabase
				.from(
					"catalog_badges",
				)
				.select("id, name")
				.eq(
					"id",
					itemId,
				)
				.maybeSingle();

			if (itemError) {
				throw itemError;
			}

			if (!item) {
				return redirectWith(
					context,
					entityType,
					"error=not-found",
				);
			}

			if (action === "delete") {
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
						context,
						entityType,
						"error=confirmation",
					);
				}

				const {
					data,
					error,
				} = await supabase
					.from(
						"catalog_badges",
					)
					.delete()
					.eq(
						"id",
						item.id,
					)
					.select("id")
					.maybeSingle();

				if (error) {
					throw error;
				}

				if (!data) {
					return redirectWith(
						context,
						entityType,
						"error=not-found",
					);
				}

				return redirectWith(
					context,
					entityType,
					"saved=badge-deleted",
				);
			}

			const {
				data,
				error,
			} = await supabase.rpc(
				"move_catalog_badge",
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

			if (!data) {
				return redirectWith(
					context,
					entityType,
					"error=not-found",
				);
			}

			return redirectWith(
				context,
				entityType,
				"saved=badge-moved",
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha na ação da taxonomia.",
				error,
			);

			return redirectWith(
				context,
				entityType,
				"error=action",
			);
		}
	};
