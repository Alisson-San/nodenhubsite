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

		const supabase =
			createSupabaseRequestClient({
				request:
					context.request,

				cookies:
					context.cookies,
			});

		await supabase.auth.signOut();

		return context.redirect(
			"/admin/login",
			303,
		);
	};