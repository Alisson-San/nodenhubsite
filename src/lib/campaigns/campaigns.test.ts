import assert from 'node:assert/strict';
import {test} from 'node:test';
import {eligibleCampaigns} from './eligibility';
import {mayDisplay, markDisplayed} from './frequency';
import {validateCampaign, saoPauloToUTC} from './validation';
const c:any={id:'b',title:'Novidade',description:'Texto',pages:['/noden-data'],format:'both',active:true,startsAt:'2026-09-24T12:00:00Z',endsAt:'2026-09-24T13:00:00Z',priority:0,frequency:'campaign',intervalDays:7,displayVersion:1,productId:null,href:'/noden-data',buttonLabel:'Ver',imageUrl:'',imageAlt:''};
test('boundary times, page and sold product suppress display',()=>{
 assert.equal(eligibleCampaigns([c],'/noden-data',Date.parse(c.startsAt)).length,1);
 assert.equal(eligibleCampaigns([c],'/noden-data',Date.parse(c.endsAt)).length,0);
 assert.equal(eligibleCampaigns([c],'/noden-home',Date.parse(c.startsAt)).length,0);
 assert.equal(eligibleCampaigns([{...c,productId:'p',productEligible:false}],'/noden-data',Date.parse(c.startsAt)).length,0);
 assert.deepEqual(eligibleCampaigns([{...c,id:'z'},{...c,id:'a'}],'/noden-data',Date.parse(c.startsAt)).map(x=>x.id),['a','z']);
});
test('frequency fails closed without storage; edits preserve history; explicit version resets',()=>{
 const m=new Map<string,string>(); const storage={getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v)}};
 assert.equal(mayDisplay(c,null,1000),false);
 assert.equal(mayDisplay(c,storage,1000),true); markDisplayed(c,storage,1000);
 assert.equal(mayDisplay({...c,title:'edit'},storage,2000),false);
 assert.equal(mayDisplay({...c,displayVersion:2},storage,2000),true);
 assert.equal(mayDisplay({...c,frequency:'days',intervalDays:1},storage,86401000),true);
 assert.equal(mayDisplay(c,{getItem(){throw Error()},setItem(){throw Error()}},1000),false);
});
test('validate dates, unsafe links, image alt and Sao Paulo conversion',()=>{
 assert.equal(saoPauloToUTC('2026-09-24T09:00'),'2026-09-24T12:00:00.000Z');
 assert.ok(validateCampaign({...c,href:'javascript:alert(1)'}).length);
 assert.ok(validateCampaign({...c,endsAt:c.startsAt}).length);
 assert.ok(validateCampaign({...c,imageUrl:'https://example.com/a.png'}).length);
 assert.deepEqual(validateCampaign(c),[]);
});
