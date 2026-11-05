import type {SupabaseClient} from '@supabase/supabase-js';
import type {ProductDetail} from './editorTypes';
import type {ServiceDivision} from '../../types/services';
import {createSupabaseServerClient} from '../supabase/server';
import {loadServicePage} from '../services/serviceRepository';
import {MEDIA_BUCKET,storageMediaPath} from './media';
export async function resolveProductMedia(detail:ProductDetail,client:SupabaseClient<any>):Promise<ProductDetail> {
 return {...detail,media:await Promise.all(detail.media.map(async media=>{const path=storageMediaPath(media.url);if(!path)return media;const {data,error}=await client.storage.from(MEDIA_BUCKET).createSignedUrl(path,300);return {...media,url:error?'':data?.signedUrl||''};}))};
}
export async function loadProductDetails(division:ServiceDivision):Promise<Record<string,ProductDetail>> {
 try {const client=createSupabaseServerClient() as SupabaseClient<any>;const {data,error}=await client.from('product_details').select('pricing_item_id,content').eq('division',division);
 if(error)return {};const entries=await Promise.all((data||[]).map(async row=>[row.pricing_item_id,await resolveProductMedia(row.content as ProductDetail,client)] as const));return Object.fromEntries(entries);
 }catch{return {};}
}
export async function loadProductBySlug(slug:string) {
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
 try{const client=createSupabaseServerClient() as SupabaseClient<any>;const {data,error}=await client.from('product_details').select('pricing_item_id,division,content').eq('content->>slug',slug).maybeSingle();
 if(error||!data)return null;const loaded=await loadServicePage(data.division as ServiceDivision);if(!loaded||loaded.source!=='supabase')return null;const item=loaded.page.pricing.find(p=>p.id===data.pricing_item_id);if(!item)return null;
 return {item,detail:await resolveProductMedia(data.content as ProductDetail,client),page:loaded.page};
 }catch{return null;}
}
