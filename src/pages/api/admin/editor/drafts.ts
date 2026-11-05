import type { APIRoute } from "astro";
import { createSupabaseRequestClient } from "../../../../lib/supabase/request";
import { isServiceDivision } from "../../../../lib/admin/divisions";
import { getEditorSnapshot, saveCatalogDraft, discardCatalogDraft, isEditorMigrationMissing } from "../../../../lib/catalog/draftRepository";
import { validateCatalogDocument } from "../../../../lib/catalog/editorValidation";
export const prerender=false;
export const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
export const validOrigin=(request:Request)=>{try{return new URL(request.headers.get("origin")??"").origin===new URL(request.url).origin;}catch{return false;}};
export function editorError(error:unknown):Response {
 const e=error as {code?:string};
 if(isEditorMigrationMissing(e)) return json({ready:false,error:"A migração do editor precisa ser aplicada antes de salvar."},503);
 if(["40001","40P01","23505"].includes(e?.code??"")) return json({error:"Conflito: outra edição alterou o catálogo ou este endereço já existe. Recarregue e compare antes de continuar."},409);
 if(["22023","23503","23514","22P02","23502"].includes(e?.code??"")) return json({error:"Dados inválidos ou referência indisponível. Revise os campos."},422);
 if(e?.code==="42501") return json({error:"Acesso negado."},403);
 if(e?.code==="P0002") return json({error:"Registro não encontrado."},404);
 return json({error:"Não foi possível concluir. Suas alterações locais foram preservadas."},500);
}
export const GET:APIRoute=async context=>{
 if(!context.locals.user||!context.locals.isAdmin) return json({error:"Acesso negado."},403);
 const division=context.url.searchParams.get("division")??undefined;
 if(!isServiceDivision(division)) return json({error:"Divisão inválida."},400);
 try {return json(await getEditorSnapshot(createSupabaseRequestClient(context),division));} catch(error){return editorError(error);}
};
export const POST:APIRoute=async context=>{
 if(!context.locals.user||!context.locals.isAdmin) return json({error:"Acesso negado."},403);
 if(!validOrigin(context.request)) return json({error:"Origem inválida."},403);
 try {
  const raw=await context.request.text(); if(raw.length>2000000) return json({error:"Conteúdo excede 2 MB."},413);
  let body; try {body=JSON.parse(raw);}catch{return json({error:"JSON inválido."},400);}
  if(!isServiceDivision(body?.division)||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0) return json({error:"Revisão ou divisão inválida."},400);
  if(body.action==="discard") {
   const client=createSupabaseRequestClient(context);
   await discardCatalogDraft(client,body.division,body.expectedRevision);
   return json(await getEditorSnapshot(client,body.division));
  }
  if(!Number.isSafeInteger(body.baseRevision)||body.baseRevision<0) return json({error:"Revisão base inválida."},400);
  const errors=validateCatalogDocument(body.document);
  if(body.document?.division!==body.division) errors.division="Divisão inconsistente.";
  if(Object.keys(errors).length) return json({error:"Revise os campos.",errors},422);
  return json(await saveCatalogDraft(createSupabaseRequestClient(context),body.division,body.expectedRevision,body.baseRevision,body.document));
 }catch(error){return editorError(error);}
};
