import type {SupabaseClient} from '@supabase/supabase-js';
import {createSupabaseServerClient} from '../supabase/server';
import {eligibleCampaigns} from './eligibility';
import {validateCampaign} from './validation';
import type {Campaign,CampaignDraft} from './types';
// These additive tables intentionally remain isolated until generated Database types are refreshed.
export async function loadCampaignDrafts(client:SupabaseClient):Promise<{drafts:CampaignDraft[];ready:boolean}>{
 const [{data,error},{data:published,error:publishedError}]=await Promise.all([client.from('campaign_drafts').select('*').order('updated_at',{ascending:false}),client.from('campaigns').select('id')]);
 if(error||publishedError)return {drafts:[],ready:false};
 return {drafts:(data??[]).map(row=>({id:row.id,revision:row.revision,content:{...row.content,id:row.id},published:published?.some(p=>p.id===row.id)??false})),ready:true};
}
export async function loadCampaigns(page:string):Promise<Campaign[]>{
 try{
  const client=createSupabaseServerClient() as SupabaseClient;
  const {data,error}=await client.from('campaigns').select('id,content');
  if(error)return [];
  const campaigns:Campaign[]=[];
  for(const row of data??[]){
   const c={...row.content,id:row.id} as Campaign;
   if(validateCampaign(c).length)continue;
   if(c.productId){
    const [{data:product,error:pe},{data:detail,error:de}]=await Promise.all([
     client.from('pricing_items').select('id,service_page_id,is_active').eq('id',c.productId).maybeSingle(),
     client.from('product_details').select('content').eq('pricing_item_id',c.productId).maybeSingle()]);
    if(pe||de||!product||!product.is_active)continue;
    const {data:pageRow,error:se}=await client.from('service_pages').select('is_published').eq('id',product.service_page_id).maybeSingle();
    c.productEligible=!se&&pageRow?.is_published===true&&(!detail||detail.content.status==='available');
   }
   campaigns.push(c);
  }
  return eligibleCampaigns(campaigns,page);
 }catch{return []}
}
