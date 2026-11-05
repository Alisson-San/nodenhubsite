import type {APIRoute} from 'astro';
import {createSupabaseRequestClient} from '../../../../lib/supabase/request';
import {MEDIA_BUCKET,validateImageUpload} from '../../../../lib/catalog/media';
export const prerender=false;
const respond=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export const POST:APIRoute=async context=>{
 if(!context.locals.user||!context.locals.isAdmin)return respond(403,{error:'Acesso negado.'});
 if(context.request.headers.get('origin')!==new URL(context.request.url).origin)return respond(403,{error:'Origem inválida.'});
 if(Number(context.request.headers.get('content-length'))>9*1024*1024)return respond(413,{error:'Envie uma imagem de até 8 MB.'});
 try{
 const reader=context.request.body?.getReader();if(!reader)return respond(400,{error:'Envio vazio.'});
 const chunks:Uint8Array[]= [];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>9*1024*1024){await reader.cancel();return respond(413,{error:'Envie uma imagem de até 8 MB.'});}chunks.push(part.value);}
 const bounded=new Uint8Array(size);let offset=0;for(const chunk of chunks){bounded.set(chunk,offset);offset+=chunk.length;}
 const form=await new Response(bounded,{headers:{'Content-Type':context.request.headers.get('content-type')||''}}).formData();const file=form.get('file');const alt=String(form.get('alt')||'').trim();if(!(file instanceof File)||!alt||alt.length>300)return respond(400,{error:'Escolha uma imagem e descreva seu conteúdo.'});
 if(file.size>8*1024*1024)return respond(413,{error:'Envie uma imagem de até 8 MB.'});const bytes=new Uint8Array(await file.arrayBuffer());const error=validateImageUpload(bytes,file.type);if(error)return respond(400,{error});
 const id=crypto.randomUUID();const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type]!;const path=id+'.'+ext;const client=createSupabaseRequestClient({request:context.request,cookies:context.cookies});
 const result=await client.storage.from(MEDIA_BUCKET).upload(path,bytes,{contentType:file.type,upsert:false});if(result.error)return respond(503,{error:'Não foi possível enviar a imagem. Verifique se a migração de mídias foi aplicada.'});
 const signed=await client.storage.from(MEDIA_BUCKET).createSignedUrl(path,300);
 return respond(201,{media:{id,type:'image',url:'storage://'+MEDIA_BUCKET+'/'+path,alt,storagePath:path},previewUrl:signed.data?.signedUrl||''});
 }catch{return respond(400,{error:'Não foi possível processar o envio.'});}
};
