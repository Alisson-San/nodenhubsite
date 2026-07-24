import type {
	User,
} from "@supabase/supabase-js";

const loopbackHosts =
	new Set([
		"localhost",
		"127.0.0.1",
		"::1",
		"[::1]",
	]);

const authenticationPaths =
	new Set([
		"/api/admin/login",
		"/api/admin/logout",
	]);

const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isAdminPath(
	pathname: string,
): boolean {
	return (
		pathname === "/admin" ||
		pathname.startsWith(
			"/admin/",
		) ||
		pathname.startsWith(
			"/api/admin/",
		)
	);
}

export function isDevAdminBypassEnabled(
	request: Request,
): boolean {
	if (
		!import.meta.env.DEV ||
		!import.meta.env.SSR ||
		import.meta.env
			.DEV_ADMIN_BYPASS !==
			"true"
	) {
		return false;
	}

	const url =
		new URL(request.url);

	return (
		loopbackHosts.has(
			url.hostname,
		) &&
		isAdminPath(
			url.pathname,
		)
	);
}

export function shouldUseDevAdminClient(
	request: Request,
): boolean {
	if (
		!isDevAdminBypassEnabled(
			request,
		)
	) {
		return false;
	}

	return !authenticationPaths.has(
		new URL(
			request.url,
		).pathname,
	);
}

export function createDevAdminUser():
	User {
	const id =
		(
			import.meta.env
				.DEV_ADMIN_USER_ID ??
			""
		).trim();

	if (!uuidPattern.test(id)) {
		throw new Error(
			[
				"DEV_ADMIN_BYPASS está ativo,",
				"mas DEV_ADMIN_USER_ID não",
				"contém o UUID de um usuário",
				"existente no Supabase Auth.",
			].join(" "),
		);
	}

	const email =
		(
			import.meta.env
				.DEV_ADMIN_EMAIL ??
			"dev-admin@noden.local"
		)
			.trim()
			.toLowerCase();

	const timestamp =
		new Date(0).toISOString();

	return {
		id,
		email,

		aud:
			"authenticated",

		role:
			"authenticated",

		app_metadata: {
			role: "admin",

			provider:
				"dev-admin-bypass",

			providers: [
				"dev-admin-bypass",
			],
		},

		user_metadata: {
			display_name:
				"Administrador local",
		},

		created_at:
			timestamp,

		updated_at:
			timestamp,

		is_anonymous:
			false,
	} as User;
}
