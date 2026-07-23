import type {
	APIRoute,
} from "astro";

import type {
	TablesInsert,
	TablesUpdate,
} from "../../../../types/database.types";

import {
	createSupabaseRequestClient,
} from "../../../../lib/supabase/request";

export const prerender = false;

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

		return url.toString();
	} catch {
		return null;
	}
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

		const socialId =
			readText(
				formData,
				"social_id",
			);

		const platform =
			readText(
				formData,
				"platform",
			).toLowerCase();

		const label =
			readText(
				formData,
				"label",
			);

		const url =
			normalizeUrl(
				readText(
					formData,
					"url",
				),
			);

		const username =
			readText(
				formData,
				"username",
			);

		const sortOrder =
			Number.parseInt(
				readText(
					formData,
					"sort_order",
				),
				10,
			);

		const isActive =
			formData.get(
				"is_active",
			) === "true";

		if (
			!platform ||
			!label ||
			!url ||
			!Number.isInteger(
				sortOrder,
			) ||
			sortOrder < 0 ||
			!/^[a-z0-9][a-z0-9_.-]{0,39}$/.test(
				platform,
			) ||
			(
				socialId &&
				!uuidPattern.test(
					socialId,
				)
			)
		) {
			return context.redirect(
				"/admin/settings?error=validation",
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

			if (socialId) {
				const payload:
					TablesUpdate<
						"social_links"
					> = {
					platform,
					label,
					url,

					username:
						username ||
						null,

					sort_order:
						sortOrder,

					is_active:
						isActive,

					updated_by:
						context.locals
							.user.id,
				};

				const {
					data,
					error,
				} = await supabase
					.from(
						"social_links",
					)
					.update(payload)
					.eq(
						"id",
						socialId,
					)
					.select("id")
					.maybeSingle();

				if (error) {
					if (
						error.code ===
							"23505"
					) {
						return context.redirect(
							"/admin/settings?error=duplicate",
							303,
						);
					}

					throw error;
				}

				if (!data) {
					return context.redirect(
						"/admin/settings?error=not-found",
						303,
					);
				}

				return context.redirect(
					"/admin/settings?saved=social-updated",
					303,
				);
			}

			const payload:
				TablesInsert<
					"social_links"
				> = {
				platform,
				label,
				url,

				username:
					username ||
					null,

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
				.from("social_links")
				.insert(payload);

			if (error) {
				if (
					error.code ===
						"23505"
				) {
					return context.redirect(
						"/admin/settings?error=duplicate",
						303,
					);
				}

				throw error;
			}

			return context.redirect(
				"/admin/settings?saved=social-created",
				303,
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha ao salvar rede social.",
				error,
			);

			return context.redirect(
				"/admin/settings?error=save",
				303,
			);
		}
	};
