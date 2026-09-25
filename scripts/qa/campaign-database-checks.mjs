import assert from 'node:assert/strict';
export default async function(db){
 const product='22222222-2222-4222-8222-222222222222';
 const id='33333333-3333-4333-8333-333333333333';
 await db.exec("reset role; set role authenticated; select set_config('request.jwt','{\"app_metadata\":{\"role\":\"admin\"}}',false)");
 await db.query('update pricing_items set is_active=true where id=$1',[product]);
 const content={id,title:'Fixture campaign',description:'Only in memory',pages:['/data'],format:'both',active:true,startsAt:null,endsAt:null,priority:1,frequency:'campaign',intervalDays:7,displayVersion:1,productId:product,href:'/data',buttonLabel:'Ver',imageUrl:'',imageAlt:''};
 async function edit(revision,action,c=null){return (await db.query('select edit_campaign($1,$2,$3,$4::jsonb) v',[id,revision,action,c&&JSON.stringify(c)])).rows[0].v}
 assert.equal(await edit(0,'save',content),1);
 await db.exec('reset role; set role anon');
 assert.equal((await db.query('select count(*)::int n from campaigns')).rows[0].n,0);
 await assert.rejects(()=>db.query('select * from campaign_drafts'),e=>e.code==='42501');
 await assert.rejects(()=>edit(1,'publish'),e=>e.code==='42501');
 await db.exec("reset role; set role authenticated; select set_config('request.jwt','{}',false)");
 assert.equal((await db.query('select count(*)::int n from campaign_drafts')).rows[0].n,0);
 await assert.rejects(()=>edit(1,'publish'),e=>e.code==='42501');
 await db.exec('select set_config(\'request.jwt\',\'{"app_metadata":{"role":"admin"}}\',false)');
 assert.equal(await edit(1,'publish'),2);
 await assert.rejects(()=>edit(1,'save',content),e=>e.code==='40001');
 await db.exec('reset role; set role anon');
 assert.equal((await db.query('select count(*)::int n from campaigns')).rows[0].n,1);
 await db.exec('reset role; set role authenticated');
 await db.query("update product_details set content=jsonb_set(content,'{status}','\"sold\"'::jsonb) where pricing_item_id=$1",[product]);
 await db.exec('reset role; set role anon');
 assert.equal((await db.query('select count(*)::int n from campaigns')).rows[0].n,0);
 await db.exec('reset role; set role authenticated');
 await assert.rejects(()=>edit(2,'publish'),e=>e.code==='P0001');
 await db.query("update product_details set content=jsonb_set(content,'{status}','\"available\"'::jsonb) where pricing_item_id=$1",[product]);
 assert.equal(await edit(2,'save',{...content,title:'Edit',displayVersion:999}),3);
 assert.equal((await db.query('select content from campaign_drafts where id=$1',[id])).rows[0].content.displayVersion,1);
 assert.equal(await edit(3,'reset'),4);
 assert.equal((await db.query('select content from campaigns where id=$1',[id])).rows[0].content.displayVersion,1);
 assert.equal(await edit(4,'publish'),5);
 assert.equal((await db.query('select content from campaigns where id=$1',[id])).rows[0].content.displayVersion,2);
 assert.equal(await edit(5,'unpublish'),6);
 await db.exec('reset role; set role anon');
 assert.equal((await db.query('select count(*)::int n from campaigns')).rows[0].n,0);
 console.log('PASS campaign draft/RLS/auth, optimistic publish, sold product, preserved history, explicit reset, unpublish');
}
