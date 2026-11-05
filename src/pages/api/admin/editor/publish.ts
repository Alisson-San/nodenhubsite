import type { APIRoute } from "astro";
import { createSupabaseRequestClient } from "../../../../lib/supabase/request";
import { isServiceDivision } from "../../../../lib/admin/divisions";
import { getEditorSnapshot,publishCatalogDraft } from "../../../../lib/catalog/draftRepository";
import { validateCatalogDocument } from "../../../../lib/catalog/editorValidation";
import { json,validOrigin,editorError } from "./drafts";
export const prerender=false;
export const POST:APIRoute=async context=>{
 if(!context.locals.user||!context.locals.isAdmin) return json({error:"Acesso negado."},403);
 if(!validOrigin(context.request)) return json({error:"Origem inválida."},403);
 try {
  let body; try{body=await context.request.json();}catch{return json({error:"JSON inválido."},400);}
  if(!isServiceDivision(body?.division)||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<1) return json({error:"Revisão ou divisão inválida."},400);
  const client=createSupabaseRequestClient(context);
  const snapshot=await getEditorSnapshot(client,body.division);
  if(!snapshot.ready) return json({ready:false,error:snapshot.message},503);
  if(!snapshot.draft) return json({error:"Salve o rascunho primeiro."},404);
  if(snapshot.draft.revision!==body.expectedRevision||snapshot.draft.baseRevision!==snapshot.sourceRevision) return json({error:"Conflito: recarregue e compare as alterações antes de publicar."},409);
  const errors=validateCatalogDocument(snapshot.draft.document);
  if(Object.keys(errors).length) return json({error:"Revise os campos.",errors},422);
  return json(await publishCatalogDraft(client,body.division,body.expectedRevision));
 }catch(error){return editorError(error);}
};
