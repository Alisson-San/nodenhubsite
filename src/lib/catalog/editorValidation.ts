import { isPlayableVideo } from "./media";
import type { CatalogDocument, ProductDetail } from "./editorTypes";
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isHttpsUrl(value:unknown, hosts?:string[]):boolean {
 if(typeof value!=="string" || value.length>2048) return false;
 try { const u=new URL(value); return u.protocol==="https:" && !u.username && !u.password && !u.port && (!hosts || hosts.includes(u.hostname)); } catch { return false; }
}
export function validateProductDetail(input:unknown, prefix="detail"):Record<string,string> {
 const errors:Record<string,string>={};
 const fail=(key:string,message:string)=>{errors[prefix+"."+key]=message;};
 if(!input || typeof input!=="object" || Array.isArray(input)) return {[prefix]:"Detalhe inválido."};
 const d=input as ProductDetail;
 if(typeof d.slug!=="string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug) || d.slug.length>100) fail("slug","Use um endereço de até 100 letras minúsculas, números e hífens.");
 for(const [key,max] of [["summary",1200],["body",20000],["version",80],["updatedAt",40]] as const)
  if(typeof d[key]!=="string" || d[key].length>max) fail(key,"Texto inválido ou muito longo.");
 if(!["available","reserved","sold","unavailable"].includes(d.status)) fail("status","Disponibilidade inválida.");
 if(!["physical","digital","service"].includes(d.modality)) fail("modality","Modalidade inválida.");
 if(!["contact","microsoft","external"].includes(d.ctaKind)) fail("ctaKind","Destino inválido.");
 if(d.ctaKind==="microsoft" && !isHttpsUrl(d.microsoftUrl,["appsource.microsoft.com","marketplace.microsoft.com"])) fail("microsoftUrl","Informe um link HTTPS do catálogo Microsoft.");
 if(d.ctaKind==="external" && !isHttpsUrl(d.externalUrl)) fail("externalUrl","Informe um endereço HTTPS válido.");
 if(!Array.isArray(d.media) || d.media.length>12) fail("media","Use no máximo 12 mídias.");
 else {
  const ids=new Set<string>();
  d.media.forEach((m,i)=>{
   if(!m || typeof m!=="object") {fail("media."+i,"Mídia inválida.");return;}
   if(typeof m.id!=="string" || !m.id || ids.has(m.id)) fail("media."+i+".id","ID de mídia inválido ou repetido."); ids.add(m.id);
   if(!["image","youtube","vimeo"].includes(m.type)) fail("media."+i+".type","Tipo inválido.");
   const stored=typeof m.url==="string" && /^storage:\/\/catalog-media\/[0-9a-f-]{36}\.(?:png|jpg|webp)$/i.test(m.url);
   if(m.type==="image" ? !stored&&!isHttpsUrl(m.url) : !(typeof m.url==="string" && isPlayableVideo(m.url,m.type))) fail("media."+i+".url","Endereço de mídia não permitido.");
   if(typeof m.alt!=="string" || m.alt.length>500 || (m.type==="image"&&!m.alt.trim())) fail("media."+i+".alt","Descreva a imagem para acessibilidade.");
   if(m.poster && !isHttpsUrl(m.poster)) fail("media."+i+".poster","Capa deve usar HTTPS.");
   if(m.caption!==undefined && (typeof m.caption!=="string" || m.caption.length>500)) fail("media."+i+".caption","Legenda muito longa.");
   for(const k of ["width","height"] as const) if(m[k]!==undefined && (!Number.isInteger(m[k]) || m[k]!<=0 || m[k]!>20000)) fail("media."+i+"."+k,"Dimensão inválida.");
  });
 }
 if(!Array.isArray(d.features) || d.features.length>40 || d.features.some(x=>typeof x!=="string"||x.length>1000)) fail("features","Recursos inválidos.");
 for(const [key,a,b] of [["steps","title","body"],["faq","question","answer"]] as const) {
  const list=d[key]; if(!Array.isArray(list)||list.length>40 || list.some(x=>!x || typeof (x as unknown as Record<string,unknown>)[a]!=="string" || typeof (x as unknown as Record<string,unknown>)[b]!=="string" || JSON.stringify(x).length>6000)) fail(key,"Lista inválida ou muito longa.");
 }
 return errors;
}
export function validateCatalogDocument(input:unknown):Record<string,string> {
 const errors:Record<string,string>={};
 if(!input || typeof input!=="object" || Array.isArray(input)) return {document:"Documento inválido."};
 const d=input as CatalogDocument;
 if(d.schemaVersion!==1 || !["home","game","data"].includes(d.division)) errors.document="Versão ou divisão inválida.";
 for(const key of ["items","serviceCards"] as const) {
  if(!Array.isArray(d[key])||d[key].length>500) {errors[key]="Use até 500 itens."; continue;}
  const ids=new Set<string>();
  d[key].forEach((row,i)=>{
   const path=key+"."+i; if(!row||typeof row!=="object"){errors[path]="Item inválido.";return;}
   if(!uuidPattern.test(row.id)||ids.has(row.id)) errors[path+".id"]="ID inválido ou duplicado."; ids.add(row.id);
   if(!uuidPattern.test(row.service_page_id)) errors[path+".service_page_id"]="Página inválida.";
   const name="name" in row?row.name:row.title;
   if(typeof name!=="string"||!name.trim()||name.length>140) errors[path+".name"]="Informe um título de até 140 caracteres.";
   if(typeof row.description!=="string"||!row.description.trim()||row.description.length>1200) errors[path+".description"]="Informe uma descrição de até 1200 caracteres.";
   if(!Number.isInteger(row.sort_order)||row.sort_order<0) errors[path+".sort_order"]="Ordem inválida.";
   if(typeof row.is_active!=="boolean") errors[path+".is_active"]="Visibilidade inválida.";
   if(!Array.isArray(row.features)||row.features.length>40||row.features.some(x=>typeof x!=="string"||x.length>1000)) errors[path+".features"]="Recursos inválidos.";
   if("price_type" in row) {
    const valueRequired=["fixed","starting_at"].includes(row.price_type);
    if(!["fixed","starting_at","free","consultation"].includes(row.price_type)|| (valueRequired ? typeof row.price!=="number"||!Number.isFinite(row.price)||row.price<0||row.price>9999999999 : row.price!==null)) errors[path+".price"]="Valor incompatível com o tipo de preço.";
    if(row.compare_at_price!==null && (typeof row.compare_at_price!=="number"||!Number.isFinite(row.compare_at_price)||row.price===null||row.compare_at_price<=row.price)) errors[path+".compare_at_price"]="O preço anterior deve ser maior que o atual.";
    if(!["service","package","product","consulting"].includes(row.item_kind)) errors[path+".item_kind"]="Tipo de item inválido.";
    if(!Array.isArray(row.badge_ids)||row.badge_ids.length>30||row.badge_ids.some(x=>!uuidPattern.test(x))) errors[path+".badge_ids"]="Selos inválidos.";
    for(const k of ["category_id","tier_id"] as const) if(row[k]!==null&&!uuidPattern.test(row[k])) errors[path+"."+k]="Referência inválida.";
   }
  });
 }
 if(!d.details || typeof d.details!=="object" || Array.isArray(d.details)) errors.details="Detalhes inválidos.";
 else {
  const slugs=new Set<string>();
  for(const [id,detail] of Object.entries(d.details)) {
   if(!Array.isArray(d.items)||!d.items.some(x=>x?.id===id)) errors["details."+id]="Produto não pertence ao documento.";
   Object.assign(errors,validateProductDetail(detail,"details."+id));
   if(detail && slugs.has(detail.slug)) errors["details."+id+".slug"]="Endereço repetido."; if(detail) slugs.add(detail.slug);
  }
 }
 return errors;
}
