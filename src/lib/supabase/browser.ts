import {
	createClient,
	type SupabaseClient,
} from "@supabase/supabase-js";

import {
	requireEnvironmentVariable,
} from "./env";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
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

	browserClient = createClient(
		url,
		publishableKey,
	);

	return browserClient;
}