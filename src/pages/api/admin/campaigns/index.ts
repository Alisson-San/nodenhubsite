import type {APIRoute} from 'astro';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createSupabaseRequestClient} from '../../../../lib/supabase/request';
import {validateCampaign} from '../../../../lib/campaigns/validation';
import {loadCampaignDrafts} from '../../../../lib/campaigns/repository';
export const prerender=false;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
export const GET:APIRoute=async context=>{
 if(!context.locals.user||!context.locals.isAdmin)return json({error:'Acesso negado.'},403);
 return json(await loadCampaignDrafts(createSupabaseRequestClient(context) as SupabaseClient));
};
export const POST:APIRoute=async context=>{
 if(!context.locals.user||!context.locals.isAdmin||context.locals.isDevAdminBypass)return json({error:'Entre com uma conta administrativa real.'},403);
 if(context.request.headers.get('Origin')!==context.url.origin)return json({error:'Origem inválida.'},403);
 try{
  const body=await context.request.json();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)||!Number.isInteger(body.revision)||body.revision<0||!['save','publish','unpublish','reset'].includes(body.action))return json({error:'Solicitação inválida.'},400);
  const client=createSupabaseRequestClient(context) as SupabaseClient;
  if(body.action==='save'){
   const errors=validateCampaign(body.content);if(errors.length)return json({error:errors.join(' '),fields:errors},400);
   body.content.id=body.id;
  }
  if(body.action==='publish'){
   const {data,error}=await client.from('campaign_drafts').select('content').eq('id',body.id).maybeSingle();
   if(error)return json({error:'Campanhas indisponíveis. Verifique a instalação das migrações.'},503);
   if(!data)return json({error:'Campanha não encontrada.'},404);
   const errors=validateCampaign(data.content);if(errors.length)return json({error:errors.join(' ')},400);
  }
  const {data,error}=await client.rpc('edit_campaign',{p_id:body.id,p_expected_revision:body.revision,p_action:body.action,p_content:body.action==='save'?body.content:null});
  if(error)return json({error:error.code==='40001'||error.code==='23505'?'Outra aba alterou esta campanha. Recarregue antes de continuar.':error.code==='P0001'?'O produto associado precisa estar publicado e disponível.':'Não foi possível salvar. Verifique as migrações e tente novamente.'},error.code==='40001'||error.code==='23505'?409:503);
  return json({revision:data});
 }catch{return json({error:'Solicitação inválida.'},400)}
};
