import type {ProductDetail} from './editorTypes';
export const MEDIA_BUCKET='catalog-media';
export function videoEmbedUrl(value:string):string|null {
 try {const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
 let id:string|null=null;
 if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})$/)?.[1]??null;
 if(u.hostname==='youtu.be')id=u.pathname.slice(1);
 if(id&&/^[\w-]{11}$/.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(u.hostname)){const v=u.pathname.match(/^\/(?:video\/)?(\d+)$/);if(v)return 'https://player.vimeo.com/video/'+v[1];}
 }catch{}return null;
}
export function validateImageUpload(bytes:Uint8Array,mime:string):string|null {
 if(bytes.length===0||bytes.length>8*1024*1024)return 'A imagem deve ter até 8 MB.';
 const png=[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 return (mime==='image/png'&&png)||(mime==='image/jpeg'&&jpg)||(mime==='image/webp'&&webp)?null:'Envie uma imagem JPEG, PNG ou WebP válida.';
}
export function productAction(detail:ProductDetail,contact:string,customLabel?:string):{href:string,label:string}|null {
 if(['sold','reserved','unavailable'].includes(detail.status))return null;
 if(detail.ctaKind==='contact')return {href:contact,label:customLabel?.trim()||'Conversar com a Noden'};
 try{const u=new URL(detail.ctaKind==='microsoft'?detail.microsoftUrl:detail.externalUrl);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
 if(detail.ctaKind==='microsoft'&&!['appsource.microsoft.com','marketplace.microsoft.com'].includes(u.hostname))return null;
 return {href:u.href,label:detail.ctaKind==='microsoft'?'Ver no catálogo Microsoft':customLabel?.trim()||'Acessar produto'};
 }catch{return null;}
}
export function storageMediaPath(url:string):string|null {
 const match=url.match(/^storage:\/\/catalog-media\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i);return match?.[1]??null;
}

export function isPlayableVideo(url:string,type:'youtube'|'vimeo'):boolean {
 const embed=videoEmbedUrl(url);
 return embed!==null && (type==='youtube'?embed.startsWith('https://www.youtube-nocookie.com/'):embed.startsWith('https://player.vimeo.com/'));
}

export function productUpdatedDate(value:string):string{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date):'';}
