// In-memory PostgreSQL via PGlite; no remote database or environment secrets.
// Install PGlite outside the repo and set PGLITE_MODULE to its dist/index.js path.
// Auth/Storage schemas are minimal stubs; this does not test the Supabase HTTP service.
import { readFile,readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE ?? '@electric-sql/pglite');
const db=new PGlite();
const root=new URL('../../',import.meta.url).pathname.replace(/\/$/,'');
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated; grant select,insert on storage.objects to anon,authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.uid',true),'')::uuid $$;
create function auth.role() returns text language sql as $$ select current_setting('request.role',true) $$;
create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt',true),''),'{}')::jsonb $$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on all functions in schema auth to anon,authenticated,service_role;
`);
const files=(await readdir(root+'/supabase/migrations')).filter(x=>x.endsWith('.sql')).sort();
for(const name of files) {
 let sql=await readFile(root+'/supabase/migrations/'+name,'utf8');
 sql=sql.replace('create extension if not exists pgcrypto;','-- gen_random_uuid built into PostgreSQL');
 await db.exec(sql);
}
const admin='11111111-1111-4111-8111-111111111111';
await db.query('insert into auth.users(id) values($1)',[admin]);
await db.exec(`select set_config('request.uid','${admin}',false),set_config('request.role','authenticated',false),set_config('request.jwt','{"app_metadata":{"role":"admin"}}',false);`);
const columns=(await db.query("select column_name from information_schema.columns where table_name='service_pages' and table_schema='public' and is_nullable='NO' and column_default is null")).rows.map(x=>x.column_name);
for(const division of ['home','game','data']) {
 const values=columns.map(x=>x==='division'?division:x==='canonical_path'?'/'+division:x.includes('color')?'#2387ff':'Fixture '+x);
 await db.query('insert into service_pages('+columns.join(',')+') values('+values.map((_,i)=>'$'+(i+1)).join(',')+')',values);
}
await db.exec("update service_pages set is_published=true; set role authenticated;");
async function snapshot(){return (await db.query("select catalog_editor_snapshot('data') as value")).rows[0].value;}
const initial=await snapshot();
const id='22222222-2222-4222-8222-222222222222';
const document=structuredClone(initial.published);
document.items.push({id,service_page_id:initial.pageId,name:'Fixture Power BI',description:'Fixture test only',price_type:'free',price:null,compare_at_price:null,price_prefix:null,price_label:null,price_suffix:null,features:[],badge:null,note:null,is_featured:false,is_active:true,sort_order:0,cta_label:null,cta_message:null,category_id:null,tier_id:null,item_kind:'product',badge_ids:[]});
document.details[id]={slug:'fixture-power-bi',summary:'Fixture',body:'Help',media:[],features:[],steps:[],faq:[],version:'1',updatedAt:'',status:'available',modality:'digital',ctaKind:'microsoft',microsoftUrl:'https://appsource.microsoft.com/product/test',externalUrl:''};
document.serviceCards.push({id:'55555555-5555-4555-8555-555555555555',service_page_id:initial.pageId,title:'Solution fixture',description:'Solution description',features:['Resource'],badge:null,is_active:true,sort_order:0});
document.details[id].media=[{id:'cover',type:'image',url:'storage://catalog-media/22222222-2222-4222-8222-222222222222.png',alt:'Fixture visual'}];
await db.query("insert into storage.objects(bucket_id,name) values('catalog-media','22222222-2222-4222-8222-222222222222.png')");
async function save(revision,base,doc){return (await db.query("select catalog_editor_save('data',$1,$2,$3::jsonb) as value",[revision,base,JSON.stringify(doc)])).rows[0].value;}
async function publish(revision){return (await db.query("select catalog_editor_publish('data',$1) as value",[revision])).rows[0].value;}
let saved=await save(0,initial.sourceRevision,document);
assert.equal(saved.revision,1);
assert.equal((await db.query('select count(*)::int n from pricing_items')).rows[0].n,0,'draft must not alter public');
await assert.rejects(()=>save(0,initial.sourceRevision,document),e=>e.code==='40001');
console.log('PASS draft privacy + competing save');
await db.exec("reset role; set role anon;");
await assert.rejects(()=>db.query("select catalog_editor_snapshot('data')"),e=>e.code==='42501');
await assert.rejects(()=>db.query("select * from catalog_drafts"),e=>e.code==='42501');
await db.exec("reset role; set role authenticated; select set_config('request.jwt','{}',false);");
assert.equal((await db.query('select count(*)::int n from catalog_drafts')).rows[0].n,0);
await assert.rejects(()=>db.query("select catalog_editor_snapshot('data')"),e=>e.code==='42501');
await db.exec(`select set_config('request.jwt','{"app_metadata":{"role":"admin"}}',false);`);
await db.exec("reset role; set role anon;");
assert.equal((await db.query('select count(*)::int n from storage.objects')).rows[0].n,0);
await db.exec("reset role; set role authenticated;");
console.log('PASS anonymous and nonadmin blocked; staged media private');
const published=await publish(1);
assert.equal(published.revision,2);
assert.equal((await db.query('select count(*)::int n from pricing_items')).rows[0].n,1);
await db.exec("reset role; set role anon;");
assert.equal((await db.query('select count(*)::int n from product_details')).rows[0].n,1);
await db.exec("reset role; set role authenticated;");
assert.equal((await db.query('select count(*)::int n from services')).rows[0].n,1);
await db.exec("reset role; set role anon;");
assert.equal((await db.query('select count(*)::int n from storage.objects')).rows[0].n,1);
await db.exec("reset role; set role authenticated;");
console.log('PASS atomic item+service publish; published detail and media public');
await db.query("update pricing_items set name='Legacy change' where id=$1",[id]);
await assert.rejects(()=>publish(2),e=>e.code==='40001');
console.log('PASS legacy write conflict');
// Build fresh draft through explicit database fixture reset, never production.
await db.query("delete from catalog_drafts where division='data'");
const current=await snapshot();
const invalid=structuredClone(current.published);
invalid.items[0].name='Should roll back';
invalid.items.push({...structuredClone(invalid.items[0]),id:'33333333-3333-4333-8333-333333333333',category_id:'44444444-4444-4444-8444-444444444444'});
await save(0,current.sourceRevision,invalid);
await assert.rejects(()=>publish(1),e=>['23503','22023'].includes(e.code));
assert.equal((await db.query('select name from pricing_items where id=$1',[id])).rows[0].name,'Legacy change');
console.log('PASS partial publish rollback');
await db.query("update pricing_items set is_active=false where id=$1",[id]);
await db.exec("reset role; set role anon;");
assert.equal((await db.query('select count(*)::int n from product_details')).rows[0].n,0);
assert.equal((await db.query('select count(*)::int n from storage.objects')).rows[0].n,0);
console.log('PASS inactive product hides details and media');
await db.exec("reset role; set role authenticated;");
await assert.rejects(()=>db.query("select catalog_editor_discard('data',999)"),e=>e.code==='40001');
await db.query("select catalog_editor_discard('data',1)");
assert.equal((await snapshot()).draft,null);
assert.equal((await db.query('select name from pricing_items where id=$1',[id])).rows[0].name,'Legacy change');
console.log('PASS discard protects revision and preserves public data');
const fresh=await snapshot(); const renamed=structuredClone(fresh.published);
renamed.details[id].slug='renamed-address';
await save(0,fresh.sourceRevision,renamed);
await assert.rejects(()=>publish(1),e=>e.code==='22023');
console.log('PASS published slug is immutable');
const {default: campaignChecks}=await import('./campaign-database-checks.mjs');
await campaignChecks(db);
await db.exec("reset role; set role authenticated;");
const mediaDocument=structuredClone(document);
mediaDocument.details[id].media=[{id:'cover',type:'youtube',url:'https://youtube.com/channel/not-a-video',alt:''}];
await assert.rejects(()=>db.query("select catalog_validate_document($1::jsonb,'data')",[JSON.stringify(mediaDocument)]),e=>e.code==='22023');
mediaDocument.details[id].media=[{id:'cover',type:'youtube',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',alt:''}];
await db.query("select catalog_validate_document($1::jsonb,'data')",[JSON.stringify(mediaDocument)]);
mediaDocument.details[id].media=Array.from({length:13},(_,i)=>({id:String(i),type:'image',url:'https://example.com/image.png',alt:'Image'}));
await assert.rejects(()=>db.query("select catalog_validate_document($1::jsonb,'data')",[JSON.stringify(mediaDocument)]),e=>e.code==='22023');
console.log('PASS SQL media limit and playable video validation');
await db.close();
