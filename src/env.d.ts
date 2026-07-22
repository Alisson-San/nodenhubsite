/// <reference types="astro/client" />

declare namespace App {
	interface Locals {
		user:
			| import("@supabase/supabase-js").User
			| null;

		isAdmin: boolean;
	}
}

interface ImportMetaEnv {
	readonly PUBLIC_SUPABASE_URL: string;
	readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
	readonly SUPABASE_SECRET_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}