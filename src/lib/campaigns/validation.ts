import {campaignPages,type Campaign} from './types';
export function safeLink(v:string):boolean{if(v.startsWith('/')&&!v.startsWith('//')&&!v.includes('\\'))return true;try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}}
export function validateCampaign(c:Campaign):string[]{
 const e:string[]=[];
 if(!c||typeof c!=='object')return ['Campanha inválida.'];
 if(typeof c.title!=='string'||!c.title.trim()||c.title.length>120)e.push('Informe um título de até 120 caracteres.');
 if(typeof c.description!=='string'||c.description.length>2000)e.push('Descrição: máximo de 2000 caracteres.');
 if(!Array.isArray(c.pages)||!c.pages.length||c.pages.some(p=>!campaignPages.includes(p as typeof campaignPages[number])))e.push('Selecione páginas válidas.');
 if(!['banner','dialog','both'].includes(c.format))e.push('Formato inválido.');
 if(!['visit','session','campaign','days'].includes(c.frequency))e.push('Frequência inválida.');
 if(!Number.isInteger(c.intervalDays)||c.intervalDays<1||c.intervalDays>365)e.push('Intervalo: 1 a 365 dias.');
 if(!Number.isInteger(c.priority)||Math.abs(c.priority)>1000)e.push('Prioridade: -1000 a 1000.');
 if(typeof c.active!=='boolean')e.push('Ativação inválida.');
 if(typeof c.href!=='string'||!safeLink(c.href))e.push('Use um endereço HTTPS ou caminho do site.');
 if(typeof c.buttonLabel!=='string'||!c.buttonLabel.trim()||c.buttonLabel.length>80)e.push('Informe o texto do botão.');
 if(c.imageUrl && (!/^https:\/\//.test(c.imageUrl)||!safeLink(c.imageUrl)||!c.imageAlt?.trim()))e.push('Imagem exige HTTPS e descrição alternativa.');
 for(const v of [c.startsAt,c.endsAt])if(v!==null && (typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T.*Z$/.test(v)||!Number.isFinite(Date.parse(v))))e.push('Data inválida.');
 if(c.startsAt&&c.endsAt&&Date.parse(c.endsAt)<=Date.parse(c.startsAt))e.push('O fim deve ser depois do início.');
 if(c.productId!==null && !/^[0-9a-f-]{36}$/i.test(c.productId))e.push('Produto inválido.');
 return e;
}
export function saoPauloToUTC(value:string):string|null{
 if(!value)return null;
 // Campaign scheduling uses the current São Paulo zone (UTC−03), verified by round trip.
 const date=new Date(value+'-03:00'); if(!Number.isFinite(date.getTime()))throw new Error('Data inválida');
 return date.toISOString();
}
export function utcToSaoPaulo(value:string|null):string{
 if(!value)return '';
 return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)).replace(' ','T');
}
