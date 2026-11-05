import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.types";
import { createSupabaseServerClient } from "../supabase/server";

/** Lê uma configuração pública. Retorna null quando indisponível. */
export async function loadPublicSetting(key: string, client?: SupabaseClient<Database>): Promise<Json | null> {
	try {
		const supabase = client ?? createSupabaseServerClient();
		const { data, error } = await supabase
			.from("site_settings")
			.select("value")
			.eq("key", key)
			.eq("is_public", true)
			.maybeSingle();
		if (error) throw error;
		return data?.value ?? null;
	} catch (error) {
		console.error(`[Noden] Configuração "${key}" indisponível.`, error);
		return null;
	}
}

/** Lê uma configuração privada (somente admin, pelo cliente da sessão). */
export async function loadPrivateSetting(client: SupabaseClient<Database>, key: string): Promise<Json | null> {
	const { data, error } = await client.from("site_settings").select("value").eq("key", key).maybeSingle();
	if (error) throw error;
	return data?.value ?? null;
}

export async function saveSetting(
	client: SupabaseClient<Database>,
	key: string,
	value: Json,
	options: { isPublic: boolean; description: string; userId?: string },
): Promise<void> {
	const { error } = await client.from("site_settings").upsert(
		{
			key,
			value,
			is_public: options.isPublic,
			description: options.description,
			updated_by: options.userId ?? null,
		},
		{ onConflict: "key" },
	);
	if (error) throw error;
}

export async function deleteSetting(client: SupabaseClient<Database>, key: string): Promise<void> {
	const { error } = await client.from("site_settings").delete().eq("key", key);
	if (error) throw error;
}
