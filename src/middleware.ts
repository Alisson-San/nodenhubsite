import {
	defineMiddleware,
} from "astro:middleware";

import {
	createSupabaseRequestClient,
} from "./lib/supabase/request";

import {
	createDevAdminUser,
	isDevAdminBypassEnabled,
} from "./lib/admin/devAdminBypass";

const publicAdminPaths = new Set([
	"/admin/login",
	"/api/admin/login",
]);

function isAdminArea(
	pathname: string,
): boolean {
	return (
		pathname === "/admin" ||
		pathname.startsWith("/admin/") ||
		pathname.startsWith("/api/admin/")
	);
}

function isAdminApi(
	pathname: string,
): boolean {
	return pathname.startsWith(
		"/api/admin/",
	);
}

function createJsonError(
	message: string,
	status: number,
): Response {
	return new Response(
		JSON.stringify({
			error: message,
		}),
		{
			status,
			headers: {
				"Content-Type":
					"application/json; charset=utf-8",

				"Cache-Control":
					"private, no-store",
			},
		},
	);
}

export const onRequest =
	defineMiddleware(
		async (
			context,
			next,
		) => {
			context.locals.user = null;
			context.locals.isAdmin = false;
			context.locals.isDevAdminBypass =
				false;

			const pathname =
				context.url.pathname;

			if (!isAdminArea(pathname)) {
				return next();
			}

			const continueWithoutCache =
				async () => {
					const response =
						await next();

					response.headers.set(
						"Cache-Control",
						"private, no-store",
					);

					return response;
				};

			if (
				isDevAdminBypassEnabled(
					context.request,
				)
			) {
				const user =
					createDevAdminUser();

				context.locals.user =
					user;

				context.locals.isAdmin =
					true;

				context.locals
					.isDevAdminBypass =
					true;

				if (
					pathname ===
					"/admin/login"
				) {
					return context.redirect(
						"/admin",
						303,
					);
				}

				const response =
					await continueWithoutCache();

				response.headers.set(
					"X-Noden-Admin-Mode",
					"development-bypass",
				);

				return response;
			}

			const supabase =
				createSupabaseRequestClient({
					request:
						context.request,

					cookies:
						context.cookies,
				});

			const {
				data,
			} =
				await supabase.auth.getUser();

			const user =
				data.user ?? null;

			const isAdmin =
				user?.app_metadata
					?.role === "admin";

			context.locals.user =
				user;

			context.locals.isAdmin =
				isAdmin;

			if (
				publicAdminPaths.has(
					pathname,
				)
			) {
				if (
					pathname ===
						"/admin/login" &&
					isAdmin
				) {
					return context.redirect(
						"/admin",
						303,
					);
				}

				return continueWithoutCache();
			}

			if (!user) {
				if (
					isAdminApi(pathname)
				) {
					return createJsonError(
						"Autenticação necessária.",
						401,
					);
				}

				return context.redirect(
					"/admin/login?error=session",
					303,
				);
			}

			if (!isAdmin) {
				await supabase.auth.signOut();

				if (
					isAdminApi(pathname)
				) {
					return createJsonError(
						"Acesso administrativo negado.",
						403,
					);
				}

				return context.redirect(
					"/admin/login?error=forbidden",
					303,
				);
			}

			return continueWithoutCache();
		},
	);
