import {
	createServerClient,
	parseCookieHeader,
} from "@supabase/ssr";

import type {
	AstroCookies,
} from "astro";

import type {
	Database,
} from "../../types/database.types";

import {
	shouldUseDevAdminClient,
} from "../admin/devAdminBypass";

import {
	createSupabaseAdminClient,
} from "./server";

import {
	requireEnvironmentVariable,
} from "./env";

interface RequestClientOptions {
	request: Request;
	cookies: AstroCookies;
}

export function createSupabaseRequestClient({
	request,
	cookies,
}: RequestClientOptions) {
	if (
		shouldUseDevAdminClient(
			request,
		)
	) {
		return createSupabaseAdminClient();
	}

	const url = requireEnvironmentVariable(
		import.meta.env.PUBLIC_SUPABASE_URL,
		"PUBLIC_SUPABASE_URL",
	);

	const publishableKey =
		requireEnvironmentVariable(
			import.meta.env
				.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
			"PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		);

	return createServerClient<Database>(
		url,
		publishableKey,
		{
			cookies: {
				getAll() {
					return parseCookieHeader(
						request.headers.get(
							"Cookie",
						) ?? "",
					);
				},

				setAll(cookiesToSet) {
					cookiesToSet.forEach(
						({
							name,
							value,
							options,
						}) => {
							cookies.set(
								name,
								value,
								options,
							);
						},
					);
				},
			},
		},
	);
}
