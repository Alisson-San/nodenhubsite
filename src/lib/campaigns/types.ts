export const campaignPages=['/','/noden-home','/noden-game','/noden-data'] as const;
export const campaignPageLabels:Record<(typeof campaignPages)[number],string>={'/':'Início','/noden-home':'Noden Home','/noden-game':'Noden Game','/noden-data':'Noden Data'};
/** Campanhas salvas antes do remapeamento de rotas. */
export const legacyCampaignPages:Record<string,(typeof campaignPages)[number]>={'/mobile':'/','/home':'/noden-home','/game':'/noden-game','/data':'/noden-data'};
export const normalizeCampaignPages=(pages:string[]):string[]=>[...new Set(pages.map(p=>legacyCampaignPages[p]??p))];
export interface Campaign {
 id:string; title:string; description:string; pages:string[]; format:'banner'|'dialog'|'both';
 active:boolean; startsAt:string|null; endsAt:string|null; priority:number;
 frequency:'visit'|'session'|'campaign'|'days'; intervalDays:number; displayVersion:number;
 productId:string|null; productEligible?:boolean; href:string; buttonLabel:string; imageUrl:string; imageAlt:string;
}
export interface CampaignDraft {id:string; revision:number; content:Campaign; published:boolean}
export const emptyCampaign = ():Campaign=>({id:crypto.randomUUID(),title:'',description:'',pages:['/noden-data'],format:'banner',active:false,startsAt:null,endsAt:null,priority:0,frequency:'campaign',intervalDays:7,displayVersion:1,productId:null,href:'',buttonLabel:'Saiba mais',imageUrl:'',imageAlt:''});
