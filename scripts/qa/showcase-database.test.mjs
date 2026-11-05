// Vitrine (projetos Data e setups Game) em PostgreSQL na memória (PGlite).
// Sem banco remoto. Uso:
// PGLITE_MODULE=/caminho/pglite/dist/index.js node scripts/qa/showcase-database.test.mjs
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE ?? '@electric-sql/pglite');
const db = new PGlite();
const root = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth; create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated; grant select,insert,delete on storage.objects to anon,authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.uid',true),'')::uuid $$;
create function auth.role() returns text language sql as $$ select current_setting('request.role',true) $$;
create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt',true),''),'{}')::jsonb $$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on all functions in schema auth to anon,authenticated,service_role;
`);
for (const name of (await readdir(root + '/supabase/migrations')).filter((x) => x.endsWith('.sql')).sort()) {
	let sql = await readFile(root + '/supabase/migrations/' + name, 'utf8');
	sql = sql.replace('create extension if not exists pgcrypto;', '-- gen_random_uuid nativo');
	await db.exec(sql);
}
const admin = '11111111-1111-4111-8111-111111111111';
await db.query('insert into auth.users(id) values($1)', [admin]);
const asAdmin = () => db.exec(`reset role; select set_config('request.uid','${admin}',false),set_config('request.jwt','{"app_metadata":{"role":"admin"}}',false); set role authenticated;`);
const asVisitor = () => db.exec(`reset role; select set_config('request.uid','',false),set_config('request.jwt','{}',false); set role anon;`);
const asUser = () => db.exec(`reset role; select set_config('request.uid','${admin}',false),set_config('request.jwt','{"app_metadata":{}}',false); set role authenticated;`);
const rejects = async (sql, params, label) => {
	await assert.rejects(db.query(sql, params), undefined, label);
	console.log('PASS', label);
};

await asAdmin();
await db.query(
	`insert into showcase_items(division,title,summary,category,tags,specs,link_url,media,is_published,sort_order)
	 values ('data','Site da loja','Loja online','Site','["Astro"]','[]','https://exemplo.com.br','[{"path":"a.webp","alt":"Tela"}]',true,0),
	        ('game','Setup branco','RGB','Setup','[]','[{"label":"GPU","value":"RTX"}]',null,'[]',false,10)`,
);
console.log('PASS admin cria itens publicados e rascunhos');

await asVisitor();
const visible = (await db.query('select title from showcase_items')).rows.map((r) => r.title);
assert.deepEqual(visible, ['Site da loja']);
console.log('PASS visitante vê só o publicado');
await rejects(`insert into showcase_items(division,title) values ('data','Invasor')`, [], 'visitante não grava');

await asUser();
await rejects(`update showcase_items set title='x'`, [], 'usuário sem papel admin não altera')
	.catch(async () => {
		// RLS em UPDATE não lança erro: confirma que nada mudou.
		await asAdmin();
		const titles = (await db.query('select title from showcase_items order by sort_order')).rows.map((r) => r.title);
		assert.deepEqual(titles, ['Site da loja', 'Setup branco']);
		console.log('PASS usuário sem papel admin não altera (RLS filtra)');
	});

await asAdmin();
await rejects(`insert into showcase_items(division,title) values ('home','Errado')`, [], 'divisão Home recusada');
await rejects(`insert into showcase_items(division,title,link_url) values ('data','X','http://inseguro.com')`, [], 'link sem HTTPS recusado');
await rejects(`insert into showcase_items(division,title) values ('data','  ')`, [], 'título vazio recusado');
await rejects(
	`insert into showcase_items(division,title,tags) values ('data','X',$1::jsonb)`,
	[JSON.stringify(Array(13).fill('t'))],
	'mais de 12 etiquetas recusado',
);

await db.exec('reset role');
const bucket = (await db.query(`select public, file_size_limit from storage.buckets where id='showcase-media'`)).rows[0];
assert.equal(bucket.public, true);
assert.equal(Number(bucket.file_size_limit), 8388608);
console.log('PASS bucket público de imagens com limite de 8 MB');

await asVisitor();
await rejects(`insert into storage.objects(bucket_id,name) values('showcase-media','x.webp')`, [], 'visitante não envia imagem');
await asAdmin();
await db.query(`insert into storage.objects(bucket_id,name) values('showcase-media','ok.webp')`);
console.log('PASS admin envia imagem');
