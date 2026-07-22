create extension if not exists pgcrypto;

create type public.service_division as enum (
	'home',
	'game',
	'data'
);

create type public.price_type as enum (
	'fixed',
	'starting_at',
	'consultation',
	'free'
);

create type public.audit_action as enum (
	'insert',
	'update',
	'delete'
);

-- =========================================================
-- Funções auxiliares
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
	select coalesce(
		(
			select auth.jwt()
				-> 'app_metadata'
				->> 'role'
		) = 'admin',
		false
	);
$$;

revoke all
	on function public.is_admin()
	from public;

grant execute
	on function public.is_admin()
	to anon, authenticated;

-- =========================================================
-- Configurações gerais
-- =========================================================

create table public.site_settings (
	key text primary key,

	value jsonb not null
		default '{}'::jsonb,

	description text,

	is_public boolean not null
		default false,

	updated_by uuid
		references auth.users(id)
		on delete set null,

	created_at timestamptz not null
		default now(),

	updated_at timestamptz not null
		default now(),

	constraint site_settings_key_format
		check (
			key ~ '^[a-z0-9_.-]+$'
		)
);

-- =========================================================
-- Configurações das páginas Home, Game e Data
-- =========================================================

create table public.service_pages (
	id uuid primary key
		default gen_random_uuid(),

	division public.service_division
		not null unique,

	seo_title text not null,
	seo_description text not null,

	canonical_path text not null unique,

	accent_color text not null
		default '#2387ff',

	accent_secondary_color text not null
		default '#6f35ff',

	hero_eyebrow text not null,
	hero_title text not null,
	hero_description text not null,

	hero_highlights jsonb not null
		default '[]'::jsonb,

	hero_primary_label text,
	hero_primary_message text not null,

	hero_secondary_label text,
	hero_secondary_href text,

	services_eyebrow text,
	services_title text not null,
	services_description text not null,

	pricing_eyebrow text,
	pricing_title text not null,
	pricing_description text not null,
	pricing_disclaimer text,

	cta_eyebrow text not null,
	cta_title text not null,
	cta_description text not null,
	cta_button_label text not null,
	cta_message text not null,
	cta_secondary_label text,
	cta_secondary_href text,

	is_published boolean not null
		default false,

	created_at timestamptz not null
		default now(),

	updated_at timestamptz not null
		default now(),

	updated_by uuid
		references auth.users(id)
		on delete set null,

	constraint service_pages_canonical_path
		check (
			canonical_path like '/%'
		),

	constraint service_pages_accent_color
		check (
			accent_color ~ '^#[0-9a-fA-F]{6}$'
		),

	constraint service_pages_secondary_color
		check (
			accent_secondary_color ~ '^#[0-9a-fA-F]{6}$'
		),

	constraint service_pages_highlights_array
		check (
			jsonb_typeof(hero_highlights) = 'array'
		)
);

-- =========================================================
-- Serviços oferecidos
-- =========================================================

create table public.services (
	id uuid primary key
		default gen_random_uuid(),

	service_page_id uuid not null
		references public.service_pages(id)
		on delete cascade,

	title text not null,
	description text not null,

	features jsonb not null
		default '[]'::jsonb,

	badge text,

	is_active boolean not null
		default true,

	sort_order integer not null
		default 0,

	created_at timestamptz not null
		default now(),

	updated_at timestamptz not null
		default now(),

	updated_by uuid
		references auth.users(id)
		on delete set null,

	constraint services_features_array
		check (
			jsonb_typeof(features) = 'array'
		),

	constraint services_sort_order
		check (
			sort_order >= 0
		)
);

create index services_page_sort_idx
	on public.services (
		service_page_id,
		sort_order
	);

create index services_active_idx
	on public.services (
		is_active
	);

-- =========================================================
-- Valores e pacotes
-- =========================================================

create table public.pricing_items (
	id uuid primary key
		default gen_random_uuid(),

	service_page_id uuid not null
		references public.service_pages(id)
		on delete cascade,

	name text not null,
	description text not null,

	price_type public.price_type not null,

	price numeric(12, 2),

	price_prefix text,
	price_label text,
	price_suffix text,

	features jsonb not null
		default '[]'::jsonb,

	badge text,
	note text,

	is_featured boolean not null
		default false,

	is_active boolean not null
		default true,

	sort_order integer not null
		default 0,

	cta_label text,
	cta_message text,

	created_at timestamptz not null
		default now(),

	updated_at timestamptz not null
		default now(),

	updated_by uuid
		references auth.users(id)
		on delete set null,

	constraint pricing_items_features_array
		check (
			jsonb_typeof(features) = 'array'
		),

	constraint pricing_items_sort_order
		check (
			sort_order >= 0
		),

	constraint pricing_items_positive_price
		check (
			price is null or price >= 0
		),

	constraint pricing_items_price_type
		check (
			(
				price_type in (
					'fixed',
					'starting_at'
				)
				and price is not null
			)
			or
			(
				price_type in (
					'consultation',
					'free'
				)
				and price is null
			)
		)
);

create index pricing_items_page_sort_idx
	on public.pricing_items (
		service_page_id,
		sort_order
	);

create index pricing_items_active_idx
	on public.pricing_items (
		is_active
	);

-- =========================================================
-- Redes sociais
-- =========================================================

create table public.social_links (
	id uuid primary key
		default gen_random_uuid(),

	platform text not null unique,
	label text not null,
	url text not null,

	username text,

	is_active boolean not null
		default true,

	sort_order integer not null
		default 0,

	created_at timestamptz not null
		default now(),

	updated_at timestamptz not null
		default now(),

	updated_by uuid
		references auth.users(id)
		on delete set null,

	constraint social_links_sort_order
		check (
			sort_order >= 0
		)
);

create index social_links_active_sort_idx
	on public.social_links (
		is_active,
		sort_order
	);

-- =========================================================
-- Perguntas frequentes
-- =========================================================

create table public.faq_items (
	id uuid primary key
		default gen_random_uuid(),

	division public.service_division,

	question text not null,
	answer text not null,

	is_active boolean not null
		default true,

	sort_order integer not null
		default 0,

	created_at timestamptz not null
		default now(),

	updated_at timestamptz not null
		default now(),

	updated_by uuid
		references auth.users(id)
		on delete set null,

	constraint faq_items_sort_order
		check (
			sort_order >= 0
		)
);

create index faq_items_division_sort_idx
	on public.faq_items (
		division,
		sort_order
	);

-- =========================================================
-- Histórico administrativo
-- =========================================================

create table public.audit_logs (
	id uuid primary key
		default gen_random_uuid(),

	actor_user_id uuid
		references auth.users(id)
		on delete set null,

	entity_type text not null,
	record_id text,

	action public.audit_action not null,

	before_data jsonb,
	after_data jsonb,

	created_at timestamptz not null
		default now()
);

create index audit_logs_created_at_idx
	on public.audit_logs (
		created_at desc
	);

create index audit_logs_entity_idx
	on public.audit_logs (
		entity_type,
		record_id
	);

-- =========================================================
-- updated_at automático
-- =========================================================

create trigger site_settings_set_updated_at
	before update on public.site_settings
	for each row
	execute function public.set_updated_at();

create trigger service_pages_set_updated_at
	before update on public.service_pages
	for each row
	execute function public.set_updated_at();

create trigger services_set_updated_at
	before update on public.services
	for each row
	execute function public.set_updated_at();

create trigger pricing_items_set_updated_at
	before update on public.pricing_items
	for each row
	execute function public.set_updated_at();

create trigger social_links_set_updated_at
	before update on public.social_links
	for each row
	execute function public.set_updated_at();

create trigger faq_items_set_updated_at
	before update on public.faq_items
	for each row
	execute function public.set_updated_at();

-- =========================================================
-- Auditoria automática
-- =========================================================

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	previous_data jsonb;
	current_data jsonb;
	target_record_id text;
begin
	if tg_op = 'INSERT' then
		current_data = to_jsonb(new);

	elsif tg_op = 'UPDATE' then
		previous_data = to_jsonb(old);
		current_data = to_jsonb(new);

	elsif tg_op = 'DELETE' then
		previous_data = to_jsonb(old);
	end if;

	target_record_id = coalesce(
		current_data ->> 'id',
		current_data ->> 'key',
		previous_data ->> 'id',
		previous_data ->> 'key'
	);

	insert into public.audit_logs (
		actor_user_id,
		entity_type,
		record_id,
		action,
		before_data,
		after_data
	)
	values (
		auth.uid(),
		tg_table_name,
		target_record_id,
		lower(tg_op)::public.audit_action,
		previous_data,
		current_data
	);

	if tg_op = 'DELETE' then
		return old;
	end if;

	return new;
end;
$$;

revoke all
	on function public.write_audit_log()
	from public;

create trigger site_settings_write_audit
	after insert or update or delete
	on public.site_settings
	for each row
	execute function public.write_audit_log();

create trigger service_pages_write_audit
	after insert or update or delete
	on public.service_pages
	for each row
	execute function public.write_audit_log();

create trigger services_write_audit
	after insert or update or delete
	on public.services
	for each row
	execute function public.write_audit_log();

create trigger pricing_items_write_audit
	after insert or update or delete
	on public.pricing_items
	for each row
	execute function public.write_audit_log();

create trigger social_links_write_audit
	after insert or update or delete
	on public.social_links
	for each row
	execute function public.write_audit_log();

create trigger faq_items_write_audit
	after insert or update or delete
	on public.faq_items
	for each row
	execute function public.write_audit_log();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.site_settings
	enable row level security;

alter table public.service_pages
	enable row level security;

alter table public.services
	enable row level security;

alter table public.pricing_items
	enable row level security;

alter table public.social_links
	enable row level security;

alter table public.faq_items
	enable row level security;

alter table public.audit_logs
	enable row level security;

-- Configurações públicas

create policy "Public can read public settings"
	on public.site_settings
	for select
	to anon, authenticated
	using (
		is_public = true
	);

create policy "Admins can manage settings"
	on public.site_settings
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Páginas publicadas

create policy "Public can read published pages"
	on public.service_pages
	for select
	to anon, authenticated
	using (
		is_published = true
	);

create policy "Admins can manage pages"
	on public.service_pages
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Serviços ativos de páginas publicadas

create policy "Public can read active services"
	on public.services
	for select
	to anon, authenticated
	using (
		is_active = true
		and exists (
			select 1
			from public.service_pages page
			where page.id = services.service_page_id
				and page.is_published = true
		)
	);

create policy "Admins can manage services"
	on public.services
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Valores ativos de páginas publicadas

create policy "Public can read active pricing"
	on public.pricing_items
	for select
	to anon, authenticated
	using (
		is_active = true
		and exists (
			select 1
			from public.service_pages page
			where page.id = pricing_items.service_page_id
				and page.is_published = true
		)
	);

create policy "Admins can manage pricing"
	on public.pricing_items
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Redes sociais

create policy "Public can read active social links"
	on public.social_links
	for select
	to anon, authenticated
	using (
		is_active = true
	);

create policy "Admins can manage social links"
	on public.social_links
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Perguntas frequentes

create policy "Public can read active faq items"
	on public.faq_items
	for select
	to anon, authenticated
	using (
		is_active = true
	);

create policy "Admins can manage faq items"
	on public.faq_items
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Auditoria: somente administradores

create policy "Admins can read audit logs"
	on public.audit_logs
	for select
	to authenticated
	using (
		(select public.is_admin())
	);

create policy "Admins can create audit logs"
	on public.audit_logs
	for insert
	to authenticated
	with check (
		(select public.is_admin())
	);

-- =========================================================
-- Permissões da API
-- =========================================================

grant usage
	on type
		public.service_division,
		public.price_type,
		public.audit_action
	to anon, authenticated;

grant select
	on
		public.site_settings,
		public.service_pages,
		public.services,
		public.pricing_items,
		public.social_links,
		public.faq_items
	to anon, authenticated;

grant insert, update, delete
	on
		public.site_settings,
		public.service_pages,
		public.services,
		public.pricing_items,
		public.social_links,
		public.faq_items
	to authenticated;

grant select, insert
	on public.audit_logs
	to authenticated;