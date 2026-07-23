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
	isCatalogIconKey,
	normalizeCatalogSlug,
} from "../../../../../lib/admin/catalogTaxonomy";

import type {
	TaxonomyEntityType,
} from "../../../../../lib/admin/catalogTaxonomy";

export const prerender = false;

const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const colorPattern =
	/^#[0-9a-fA-F]{6}$/;

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

function parseSortOrder(
	value: string,
): number | null {
	const parsed =
		Number.parseInt(
			value,
			10,
		);

	return (
		Number.isInteger(parsed) &&
		parsed >= 0
	)
		? parsed
		: null;
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

		if (
			!isEntityType(
				entityType,
			)
		) {
			return new Response(
				"Tipo de registro inválido.",
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

		const itemId =
			readText(
				formData,
				"item_id",
			);

		const name =
			readText(
				formData,
				"name",
			);

		const slug =
			normalizeCatalogSlug(
				readText(
					formData,
					"slug",
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
			!name ||
			name.length > 80 ||
			!slug ||
			slug.length > 80 ||
			sortOrder === null ||
			(
				itemId &&
				!uuidPattern.test(
					itemId,
				)
			)
		) {
			return redirectWith(
				context,
				entityType,
				"error=validation",
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
			if (
				entityType ===
				"category"
			) {
				const servicePageId =
					readText(
						formData,
						"service_page_id",
					);

				const description =
					readText(
						formData,
						"description",
					);

				const iconKey =
					readText(
						formData,
						"icon_key",
					);

				const color =
					readText(
						formData,
						"color",
					);

				if (
					!uuidPattern.test(
						servicePageId,
					) ||
					description.length > 500 ||
					(
						iconKey &&
						!isCatalogIconKey(
							iconKey,
						)
					) ||
					!colorPattern.test(
						color,
					)
				) {
					return redirectWith(
						context,
						entityType,
						"error=validation",
					);
				}

				if (itemId) {
					const payload:
						TablesUpdate<
							"catalog_categories"
						> = {
							name,
							slug,

							description:
								description ||
								null,

							icon_key:
								iconKey ||
								null,

							color,
							is_active:
								isActive,

							sort_order:
								sortOrder,

							updated_by:
								context.locals
									.user.id,
						};

					const {
						data,
						error,
					} = await supabase
						.from(
							"catalog_categories",
						)
						.update(payload)
						.eq(
							"id",
							itemId,
						)
						.select("id")
						.maybeSingle();

					if (error) {
						if (
							error.code ===
								"23505"
						) {
							return redirectWith(
								context,
								entityType,
								"error=duplicate",
							);
						}

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
						"saved=category-updated",
					);
				}

				const {
					data: page,
					error: pageError,
				} = await supabase
					.from(
						"service_pages",
					)
					.select("id")
					.eq(
						"id",
						servicePageId,
					)
					.maybeSingle();

				if (
					pageError ||
					!page
				) {
					return redirectWith(
						context,
						entityType,
						"error=validation",
					);
				}

				const payload:
					TablesInsert<
						"catalog_categories"
					> = {
						service_page_id:
							page.id,

						name,
						slug,

						description:
							description ||
							null,

						icon_key:
							iconKey ||
							null,

						color,
						is_active:
							isActive,

						sort_order:
							sortOrder,

						updated_by:
							context.locals
								.user.id,
					};

				const {
					data,
					error,
				} = await supabase
					.from(
						"catalog_categories",
					)
					.insert(payload)
					.select("id")
					.maybeSingle();

				if (error) {
					if (
						error.code ===
							"23505"
					) {
						return redirectWith(
							context,
							entityType,
							"error=duplicate",
						);
					}

					throw error;
				}

				if (!data) {
					throw new Error(
						"Categoria não criada.",
					);
				}

				return redirectWith(
					context,
					entityType,
					"saved=category-created",
				);
			}

			if (
				entityType ===
				"tier"
			) {
				const description =
					readText(
						formData,
						"description",
					);

				const color =
					readText(
						formData,
						"color",
					);

				if (
					description.length > 500 ||
					!colorPattern.test(
						color,
					)
				) {
					return redirectWith(
						context,
						entityType,
						"error=validation",
					);
				}

				const payload = {
					name,
					slug,

					description:
						description ||
						null,

					color,
					is_active:
						isActive,

					sort_order:
						sortOrder,

					updated_by:
						context.locals
							.user.id,
				};

				if (itemId) {
					const {
						data,
						error,
					} = await supabase
						.from(
							"catalog_tiers",
						)
						.update(
							payload satisfies
								TablesUpdate<
									"catalog_tiers"
								>,
						)
						.eq(
							"id",
							itemId,
						)
						.select("id")
						.maybeSingle();

					if (error) {
						if (
							error.code ===
								"23505"
						) {
							return redirectWith(
								context,
								entityType,
								"error=duplicate",
							);
						}

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
						"saved=tier-updated",
					);
				}

				const {
					data,
					error,
				} = await supabase
					.from(
						"catalog_tiers",
					)
					.insert(
						payload satisfies
							TablesInsert<
								"catalog_tiers"
							>,
					)
					.select("id")
					.maybeSingle();

				if (error) {
					if (
						error.code ===
							"23505"
					) {
						return redirectWith(
							context,
							entityType,
							"error=duplicate",
						);
					}

					throw error;
				}

				if (!data) {
					throw new Error(
						"Nível não criado.",
					);
				}

				return redirectWith(
					context,
					entityType,
					"saved=tier-created",
				);
			}

			const iconKey =
				readText(
					formData,
					"icon_key",
				);

			const textColor =
				readText(
					formData,
					"text_color",
				);

			const backgroundColor =
				readText(
					formData,
					"background_color",
				);

			const borderColor =
				readText(
					formData,
					"border_color",
				);

			if (
				(
					iconKey &&
					!isCatalogIconKey(
						iconKey,
					)
				) ||
				!colorPattern.test(
					textColor,
				) ||
				!colorPattern.test(
					backgroundColor,
				) ||
				!colorPattern.test(
					borderColor,
				)
			) {
				return redirectWith(
					context,
					entityType,
					"error=validation",
				);
			}

			const payload = {
				name,
				slug,

				icon_key:
					iconKey ||
					null,

				text_color:
					textColor,

				background_color:
					backgroundColor,

				border_color:
					borderColor,

				is_active:
					isActive,

				sort_order:
					sortOrder,

				updated_by:
					context.locals
						.user.id,
			};

			if (itemId) {
				const {
					data,
					error,
				} = await supabase
					.from(
						"catalog_badges",
					)
					.update(
						payload satisfies
							TablesUpdate<
								"catalog_badges"
							>,
					)
					.eq(
						"id",
						itemId,
					)
					.select("id")
					.maybeSingle();

				if (error) {
					if (
						error.code ===
							"23505"
					) {
						return redirectWith(
							context,
							entityType,
							"error=duplicate",
						);
					}

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
					"saved=badge-updated",
				);
			}

			const {
				data,
				error,
			} = await supabase
				.from(
					"catalog_badges",
				)
				.insert(
					payload satisfies
						TablesInsert<
							"catalog_badges"
						>,
				)
				.select("id")
				.maybeSingle();

			if (error) {
				if (
					error.code ===
						"23505"
				) {
					return redirectWith(
						context,
						entityType,
						"error=duplicate",
					);
				}

				throw error;
			}

			if (!data) {
				throw new Error(
					"Selo não criado.",
				);
			}

			return redirectWith(
				context,
				entityType,
				"saved=badge-created",
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha ao salvar taxonomia.",
				error,
			);

			return redirectWith(
				context,
				entityType,
				"error=save",
			);
		}
	};
