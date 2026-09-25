export const campaignPages=['/','/mobile','/home','/game','/data'] as const;
export interface Campaign {
 id:string; title:string; description:string; pages:string[]; format:'banner'|'dialog'|'both';
 active:boolean; startsAt:string|null; endsAt:string|null; priority:number;
 frequency:'visit'|'session'|'campaign'|'days'; intervalDays:number; displayVersion:number;
 productId:string|null; productEligible?:boolean; href:string; buttonLabel:string; imageUrl:string; imageAlt:string;
}
export interface CampaignDraft {id:string; revision:number; content:Campaign; published:boolean}
export const emptyCampaign = ():Campaign=>({id:crypto.randomUUID(),title:'',description:'',pages:['/data'],format:'banner',active:false,startsAt:null,endsAt:null,priority:0,frequency:'campaign',intervalDays:7,displayVersion:1,productId:null,href:'',buttonLabel:'Saiba mais',imageUrl:'',imageAlt:''});
