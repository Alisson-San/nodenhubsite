import type {
	APIRoute,
} from "astro";

import {
	createSupabaseRequestClient,
} from "../../../lib/supabase/request";

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

export const POST: APIRoute =
	async (context) => {
		if (
			!hasValidOrigin(
				context.request,
			)
		) {
			return new Response(
				"Origem da requisição inválida.",
				{
					status: 403,
				},
			);
		}

		const formData =
			await context.request
				.formData();

		const email = String(
			formData.get("email") ?? "",
		)
			.trim()
			.toLowerCase();

		const password = String(
			formData.get("password") ??
				"",
		);

		if (
			!email ||
			!password
		) {
			return context.redirect(
				"/admin/login?error=invalid",
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
				data,
				error,
			} =
				await supabase.auth
					.signInWithPassword({
						email,
						password,
					});

			if (
				error ||
				!data.user
			) {
				return context.redirect(
					"/admin/login?error=credentials",
					303,
				);
			}

			const isAdmin =
				data.user.app_metadata
					?.role === "admin";

			if (!isAdmin) {
				await supabase.auth
					.signOut();

				return context.redirect(
					"/admin/login?error=forbidden",
					303,
				);
			}

			return context.redirect(
				"/admin",
				303,
			);
		} catch (error) {
			console.error(
				"[Noden Admin] Falha no login.",
				error,
			);

			return context.redirect(
				"/admin/login?error=service",
				303,
			);
		}
	};