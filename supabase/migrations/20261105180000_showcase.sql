-- Vitrine da Noden: projetos entregues pela Noden Data (sites, sistemas,
-- dashboards) e setups montados pela Noden Game.
-- Aditiva: não altera tabelas existentes. Requer autorização para aplicar.

create table public.showcase_items (
	id uuid primary key default gen_random_uuid(),
	division public.service_division not null,
	title text not null,
	summary text not null default '',
	category text not null default '',
	tags jsonb not null default '[]'::jsonb,
	specs jsonb not null default '[]'::jsonb,
	link_url text,
	media jsonb not null default '[]'::jsonb,
	is_published boolean not null default false,
	sort_order integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	updated_by uuid references auth.users(id) on delete set null,

	constraint showcase_division check (division in ('game', 'data')),
	constraint showcase_title check (char_length(btrim(title)) between 1 and 120),
	constraint showcase_summary check (char_length(summary) <= 800),
	constraint showcase_category check (char_length(category) <= 60),
	constraint showcase_tags check (jsonb_typeof(tags) = 'array' and jsonb_array_length(tags) <= 12),
	constraint showcase_specs check (jsonb_typeof(specs) = 'array' and jsonb_array_length(specs) <= 16),
	constraint showcase_media check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 12),
	constraint showcase_link check (
		link_url is null
		or (char_length(link_url) <= 2048 and link_url ~ '^https://[^/@[:space:]]+(/|$)')
	),
	constraint showcase_order check (sort_order >= 0)
);

create index showcase_items_division_order on public.showcase_items (division, sort_order);

create trigger showcase_items_set_updated_at
	before update on public.showcase_items
	for each row execute function public.set_updated_at();

alter table public.showcase_items enable row level security;

revoke all on public.showcase_items from anon, authenticated;
grant select on public.showcase_items to anon, authenticated;
grant insert, update, delete on public.showcase_items to authenticated;

-- Visitantes veem só o que foi publicado; administradores gerenciam tudo.
create policy showcase_public_read on public.showcase_items
	for select to anon, authenticated
	using (is_published);

create policy showcase_admin_all on public.showcase_items
	for all to authenticated
	using ((select public.is_admin()))
	with check ((select public.is_admin()));

-- Imagens da vitrine: bucket público (leitura por URL), escrita só de admins.
-- Nomes de arquivo são UUIDs gerados pelo servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('showcase-media', 'showcase-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy showcase_media_admin_insert on storage.objects
	for insert to authenticated
	with check (bucket_id = 'showcase-media' and (select public.is_admin()));

create policy showcase_media_admin_delete on storage.objects
	for delete to authenticated
	using (bucket_id = 'showcase-media' and (select public.is_admin()));
