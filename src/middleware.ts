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

/**
 * Páginas públicas: visitantes não pagam a verificação de sessão.
 * Só consultamos o Supabase quando há cookie de autenticação, para
 * ativar o modo de edição do administrador no próprio site.
 */
function hasAuthCookie(
	request: Request,
): boolean {
	const header =
		request.headers.get("cookie") ?? "";

	return /(?:^|;\s*)sb-[^=]*-auth-token(?:\.\d+)?=/.test(
		header,
	);
}

const editablePublicPaths =
	new Set([
		"/",
		"/noden-home",
		"/noden-game",
		"/noden-data",
	]);

async function handlePublicRequest(
	context: Parameters<
		Parameters<
			typeof defineMiddleware
		>[0]
	>[0],
	next: () => Promise<Response>,
): Promise<Response> {
	const pathname =
		context.url.pathname.replace(
			/\/$/,
			"",
		) || "/";

	if (
		context.isPrerendered ||
		!editablePublicPaths.has(
			pathname,
		) ||
		!hasAuthCookie(
			context.request,
		)
	) {
		return next();
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
		} =
			await supabase.auth.getUser();

		context.locals.user =
			data.user ?? null;

		context.locals.isAdmin =
			data.user?.app_metadata
				?.role === "admin";
	} catch {
		// Sem sessão válida: segue como visitante.
	}

	const response =
		await next();

	if (context.locals.isAdmin) {
		response.headers.set(
			"Cache-Control",
			"private, no-store",
		);
	}

	return response;
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
				return handlePublicRequest(
					context,
					next,
				);
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
