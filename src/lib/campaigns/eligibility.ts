import type {Campaign} from './types';
export function eligibleCampaigns(campaigns:Campaign[],page:string,now=Date.now()):Campaign[]{
 return campaigns.filter(c=>c.active && c.pages.includes(page) && (!c.startsAt||Date.parse(c.startsAt)<=now)&&(!c.endsAt||now<Date.parse(c.endsAt))&&(!c.productId||c.productEligible===true)).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
}
