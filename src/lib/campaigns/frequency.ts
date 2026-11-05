import type {Campaign} from './types';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
const key=(c:Campaign)=>'noden:campaign:'+c.id+':'+c.displayVersion;
export function mayDisplay(c:Campaign,storage:StorageLike|null,now=Date.now()):boolean{
 if(!storage)return false;
 try{
  storage.setItem('noden:campaign:probe','1');
  const value=storage.getItem(key(c)); if(c.frequency==='visit'||value===null)return true;
  return c.frequency==='days' && Number.isFinite(Number(value)) && now-Number(value)>=c.intervalDays*86400000;
 }catch{return false}
}
export function markDisplayed(c:Campaign,storage:StorageLike,now=Date.now()):boolean{try{storage.setItem(key(c),String(now));return true}catch{return false}}
