import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.types";
import type { ServiceDivision } from "../../types/services";
import type { CatalogDocument, CatalogDraft, EditorSnapshot } from "./editorTypes";

// Isolated adapter until generated DB types include the reviewed additive migration.
type EditorDatabase = {public:{Tables:Database["public"]["Tables"];Views:Database["public"]["Views"];Enums:Database["public"]["Enums"];CompositeTypes:Database["public"]["CompositeTypes"];Functions:Database["public"]["Functions"] & {
 catalog_editor_discard:{Args:{p_division:ServiceDivision;p_expected_revision:number};Returns:Json};
 catalog_editor_snapshot:{Args:{p_division:ServiceDivision};Returns:Json};
 catalog_editor_save:{Args:{p_division:ServiceDivision;p_expected_revision:number;p_base_revision:number;p_document:Json};Returns:Json};
 catalog_editor_publish:{Args:{p_division:ServiceDivision;p_expected_revision:number};Returns:Json};
}}};
const editorClient=(client:SupabaseClient<Database>)=>client as unknown as SupabaseClient<EditorDatabase>;
export function isEditorMigrationMissing(error:{code?:string;message?:string}|null):boolean {
 return !!error && (["PGRST202","42P01","42883"].includes(error.code??"") || (error.code==="PGRST205" && /catalog_|product_details/.test(error.message??"")));
}
export async function getEditorSnapshot(client:SupabaseClient<Database>,division:ServiceDivision):Promise<EditorSnapshot> {
 const {data,error}=await editorClient(client).rpc("catalog_editor_snapshot",{p_division:division});
 if(error&&!isEditorMigrationMissing(error)) throw error;
 let result:Omit<EditorSnapshot,"categories"|"tiers"|"badges">;
 if(error) {
  const page=await client.from("service_pages").select("id").eq("division",division).maybeSingle();
  if(page.error) throw page.error;
  const pageId=page.data?.id??null;
  let items:CatalogDocument["items"]=[], serviceCards:CatalogDocument["serviceCards"]=[];
  if(pageId) {
   const [prices,services]=await Promise.all([
    client.from("pricing_items").select("*").eq("service_page_id",pageId).order("sort_order"),
    client.from("services").select("*").eq("service_page_id",pageId).order("sort_order"),
   ]);
   if(prices.error) throw prices.error; if(services.error) throw services.error;
   const ids=(prices.data??[]).map(x=>x.id);
   const badges=ids.length?await client.from("pricing_item_badges").select("pricing_item_id,badge_id").in("pricing_item_id",ids):{data:[],error:null};
   if(badges.error) throw badges.error;
   items=(prices.data??[]).map(x=>({...x,badge_ids:(badges.data??[]).filter(b=>b.pricing_item_id===x.id).map(b=>b.badge_id)})); serviceCards=services.data??[];
  }
  result={ready:false,draft:null,published:{schemaVersion:1,division,items,serviceCards,details:{}},sourceRevision:0,pageId,message:"A migração do editor ainda não foi aplicada. Prévia disponível; salvamento e publicação desativados."};
 } else result=data as unknown as typeof result;
 const [categories,tiers,badges]=await Promise.all([
  result.pageId?client.from("catalog_categories").select("*").eq("service_page_id",result.pageId).order("sort_order"):Promise.resolve({data:[],error:null}),
  client.from("catalog_tiers").select("*").order("sort_order"),client.from("catalog_badges").select("*").order("sort_order")
 ]);
 if(categories.error) throw categories.error; if(tiers.error) throw tiers.error; if(badges.error) throw badges.error;
 return {...result,categories:categories.data??[],tiers:tiers.data??[],badges:badges.data??[]};
}
export async function saveCatalogDraft(client:SupabaseClient<Database>,division:ServiceDivision,expectedRevision:number,baseRevision:number,document:CatalogDocument):Promise<{draft:CatalogDraft;revision:number}> {
 const {data,error}=await editorClient(client).rpc("catalog_editor_save",{p_division:division,p_expected_revision:expectedRevision,p_base_revision:baseRevision,p_document:document as unknown as Json});
 if(error) throw error; return data as unknown as {draft:CatalogDraft;revision:number};
}
export async function publishCatalogDraft(client:SupabaseClient<Database>,division:ServiceDivision,expectedRevision:number):Promise<{revision:number;sourceRevision:number}> {
 const {data,error}=await editorClient(client).rpc("catalog_editor_publish",{p_division:division,p_expected_revision:expectedRevision});
 if(error) throw error; return data as unknown as {revision:number;sourceRevision:number};
}

export async function discardCatalogDraft(client:SupabaseClient<Database>,division:ServiceDivision,expectedRevision:number):Promise<void> {
 const {error}=await editorClient(client).rpc("catalog_editor_discard",{p_division:division,p_expected_revision:expectedRevision});
 if(error) throw error;
}