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

let browserClient:
	| SupabaseClient<Database>
	| undefined;

export function getSupabaseBrowserClient():
	SupabaseClient<Database> {
	if (browserClient) {
		return browserClient;
	}

	const url = requireEnvironmentVariable(
		import.meta.env.PUBLIC_SUPABASE_URL,
		"PUBLIC_SUPABASE_URL",
	);

	const publishableKey = requireEnvironmentVariable(
		import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		"PUBLIC_SUPABASE_PUBLISHABLE_KEY",
	);

	browserClient = createClient<Database>(
		url,
		publishableKey,
	);

	return browserClient;
}

