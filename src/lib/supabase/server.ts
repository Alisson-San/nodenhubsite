import {
	createClient,
	type SupabaseClient,
} from "@supabase/supabase-js";

import {
	requireEnvironmentVariable,
} from "./env";

import type {
	Database,
} from "../../types/database.types";

const authOptions = {
	autoRefreshToken: false,
	persistSession: false,
	detectSessionInUrl: false,
} as const;

export function createSupabaseServerClient():
	SupabaseClient<Database> {
	const url = requireEnvironmentVariable(
		import.meta.env.PUBLIC_SUPABASE_URL,
		"PUBLIC_SUPABASE_URL",
	);

	const publishableKey = requireEnvironmentVariable(
		import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		"PUBLIC_SUPABASE_PUBLISHABLE_KEY",
	);

	return createClient<Database>(
		url,
		publishableKey,
		{
			auth: authOptions,
		},
	);
}

export function createSupabaseAdminClient():
	SupabaseClient<Database> {
	if (!import.meta.env.SSR) {
		throw new Error(
			"O cliente administrativo do Supabase só pode ser usado no servidor.",
		);
	}

	const url = requireEnvironmentVariable(
		import.meta.env.PUBLIC_SUPABASE_URL,
		"PUBLIC_SUPABASE_URL",
	);

	const secretKey = requireEnvironmentVariable(
		import.meta.env.SUPABASE_SECRET_KEY,
		"SUPABASE_SECRET_KEY",
	);

	return createClient<Database>(
		url,
		secretKey,
		{
			auth: authOptions,
		},
	);
}

