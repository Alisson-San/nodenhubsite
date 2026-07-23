-- =========================================================
-- Catálogo 2.0
-- Categorias, níveis, selos reutilizáveis e promoções
-- =========================================================

create type public.catalog_item_kind as enum (
	'service',
	'package',
	'product',
	'consulting'
);

-- =========================================================
-- Categorias por divisão
-- =========================================================

create table public.catalog_categories (
	id uuid primary key
		default gen_random_uuid(),

	service_page_id uuid not null
		references public.service_pages(id)
		on delete cascade,

	name text not null,
	slug text not null,
	description text,

	icon_key text,

	color text not null
		default '#2387ff',

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

	constraint catalog_categories_name_not_blank
		check (
			length(trim(name)) > 0
		),

	constraint catalog_categories_slug_format
		check (
			slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
		),

	constraint catalog_categories_color
		check (
			color ~ '^#[0-9a-fA-F]{6}$'
		),

	constraint catalog_categories_sort_order
		check (
			sort_order >= 0
		),

	constraint catalog_categories_page_slug_unique
		unique (
			service_page_id,
			slug
		)
);

create unique index catalog_categories_page_name_unique_idx
	on public.catalog_categories (
		service_page_id,
		lower(name)
	);

create index catalog_categories_page_sort_idx
	on public.catalog_categories (
		service_page_id,
		sort_order,
		created_at
	);

create index catalog_categories_active_idx
	on public.catalog_categories (
		is_active
	);

-- =========================================================
-- Níveis ou modalidades reutilizáveis
-- Ex.: Essencial, Completo, Avançado e Premium
-- =========================================================

create table public.catalog_tiers (
	id uuid primary key
		default gen_random_uuid(),

	name text not null,
	slug text not null unique,
	description text,

	color text not null
		default '#4f8cff',

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

	constraint catalog_tiers_name_not_blank
		check (
			length(trim(name)) > 0
		),

	constraint catalog_tiers_slug_format
		check (
			slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
		),

	constraint catalog_tiers_color
		check (
			color ~ '^#[0-9a-fA-F]{6}$'
		),

	constraint catalog_tiers_sort_order
		check (
			sort_order >= 0
		)
);

create unique index catalog_tiers_name_unique_idx
	on public.catalog_tiers (
		lower(name)
	);

create index catalog_tiers_active_sort_idx
	on public.catalog_tiers (
		is_active,
		sort_order,
		created_at
	);

-- =========================================================
-- Selos comerciais reutilizáveis
-- Ex.: Promoção, Mais popular, Recomendado e Novidade
-- =========================================================

create table public.catalog_badges (
	id uuid primary key
		default gen_random_uuid(),

	name text not null,
	slug text not null unique,

	icon_key text,

	text_color text not null
		default '#ffffff',

	background_color text not null
		default '#17375f',

	border_color text not null
		default '#2f78c8',

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

	constraint catalog_badges_name_not_blank
		check (
			length(trim(name)) > 0
		),

	constraint catalog_badges_slug_format
		check (
			slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
		),

	constraint catalog_badges_text_color
		check (
			text_color ~ '^#[0-9a-fA-F]{6}$'
		),

	constraint catalog_badges_background_color
		check (
			background_color ~ '^#[0-9a-fA-F]{6}$'
		),

	constraint catalog_badges_border_color
		check (
			border_color ~ '^#[0-9a-fA-F]{6}$'
		),

	constraint catalog_badges_sort_order
		check (
			sort_order >= 0
		)
);

create unique index catalog_badges_name_unique_idx
	on public.catalog_badges (
		lower(name)
	);

create index catalog_badges_active_sort_idx
	on public.catalog_badges (
		is_active,
		sort_order,
		created_at
	);

-- =========================================================
-- Ampliação dos itens de preço
-- =========================================================

alter table public.pricing_items
	add column category_id uuid
		references public.catalog_categories(id)
		on delete set null,

	add column tier_id uuid
		references public.catalog_tiers(id)
		on delete set null,

	add column item_kind public.catalog_item_kind
		not null
		default 'service',

	add column compare_at_price numeric(12, 2);

alter table public.pricing_items
	add constraint pricing_items_compare_at_price
	check (
		compare_at_price is null
		or (
			price is not null
			and compare_at_price > price
		)
	);

create index pricing_items_category_idx
	on public.pricing_items (
		category_id
	);

create index pricing_items_tier_idx
	on public.pricing_items (
		tier_id
	);

create index pricing_items_kind_idx
	on public.pricing_items (
		item_kind
	);

create index pricing_items_catalog_filter_idx
	on public.pricing_items (
		service_page_id,
		is_active,
		item_kind,
		category_id,
		tier_id,
		sort_order
	);

comment on column public.pricing_items.badge is
	'Campo legado mantido temporariamente durante a migração para catalog_tiers e catalog_badges.';

comment on column public.pricing_items.compare_at_price is
	'Preço anterior exibido riscado quando for maior que o preço atual.';

-- =========================================================
-- Relação de vários selos por item
-- =========================================================

create table public.pricing_item_badges (
	id uuid primary key
		default gen_random_uuid(),

	pricing_item_id uuid not null
		references public.pricing_items(id)
		on delete cascade,

	badge_id uuid not null
		references public.catalog_badges(id)
		on delete cascade,

	sort_order integer not null
		default 0,

	created_at timestamptz not null
		default now(),

	updated_at timestamptz not null
		default now(),

	updated_by uuid
		references auth.users(id)
		on delete set null,

	constraint pricing_item_badges_sort_order
		check (
			sort_order >= 0
		),

	constraint pricing_item_badges_unique
		unique (
			pricing_item_id,
			badge_id
		)
);

create index pricing_item_badges_item_sort_idx
	on public.pricing_item_badges (
		pricing_item_id,
		sort_order,
		created_at
	);

create index pricing_item_badges_badge_idx
	on public.pricing_item_badges (
		badge_id
	);

-- =========================================================
-- Migração dos selos antigos para níveis
-- Os valores atuais como Essencial, Completa e Presença Digital
-- são preservados e associados automaticamente aos itens.
-- =========================================================

with distinct_legacy_badges as (
	select distinct
		trim(badge) as name
	from public.pricing_items
	where badge is not null
		and length(trim(badge)) > 0
),
normalized_legacy_badges as (
	select
		name,

		coalesce(
			nullif(
				trim(
					both '-'
					from regexp_replace(
						translate(
							lower(name),
							'áàãâäéèêëíìîïóòõôöúùûüç',
							'aaaaaeeeeiiiiooooouuuuc'
						),
						'[^a-z0-9]+',
						'-',
						'g'
					)
				),
				''
			),
			'nivel-' || left(md5(name), 8)
		) as base_slug
	from distinct_legacy_badges
),
resolved_legacy_badges as (
	select
		name,

		case
			when count(*) over (
				partition by base_slug
			) > 1
			then
				base_slug || '-' ||
					left(md5(name), 8)

			else base_slug
		end as slug,

		row_number() over (
			order by lower(name)
		) * 10 as sort_order
	from normalized_legacy_badges
)
insert into public.catalog_tiers (
	name,
	slug,
	description,
	color,
	is_active,
	sort_order
)
select
	name,
	slug,
	'Nível migrado automaticamente do campo de selo antigo.',
	'#4f8cff',
	true,
	sort_order
from resolved_legacy_badges
on conflict (slug)
	do nothing;

with distinct_legacy_badges as (
	select distinct
		trim(badge) as name
	from public.pricing_items
	where badge is not null
		and length(trim(badge)) > 0
),
normalized_legacy_badges as (
	select
		name,

		coalesce(
			nullif(
				trim(
					both '-'
					from regexp_replace(
						translate(
							lower(name),
							'áàãâäéèêëíìîïóòõôöúùûüç',
							'aaaaaeeeeiiiiooooouuuuc'
						),
						'[^a-z0-9]+',
						'-',
						'g'
					)
				),
				''
			),
			'nivel-' || left(md5(name), 8)
		) as base_slug
	from distinct_legacy_badges
),
resolved_legacy_badges as (
	select
		name,

		case
			when count(*) over (
				partition by base_slug
			) > 1
			then
				base_slug || '-' ||
					left(md5(name), 8)

			else base_slug
		end as slug
	from normalized_legacy_badges
)
update public.pricing_items as item
set tier_id = tier.id
from resolved_legacy_badges as legacy
join public.catalog_tiers as tier
	on tier.slug = legacy.slug
where item.badge is not null
	and trim(item.badge) = legacy.name
	and item.tier_id is null;

-- =========================================================
-- updated_at automático
-- =========================================================

create trigger catalog_categories_set_updated_at
	before update on public.catalog_categories
	for each row
	execute function public.set_updated_at();

create trigger catalog_tiers_set_updated_at
	before update on public.catalog_tiers
	for each row
	execute function public.set_updated_at();

create trigger catalog_badges_set_updated_at
	before update on public.catalog_badges
	for each row
	execute function public.set_updated_at();

create trigger pricing_item_badges_set_updated_at
	before update on public.pricing_item_badges
	for each row
	execute function public.set_updated_at();

-- =========================================================
-- Auditoria automática
-- =========================================================

create trigger catalog_categories_write_audit
	after insert or update or delete
	on public.catalog_categories
	for each row
	execute function public.write_audit_log();

create trigger catalog_tiers_write_audit
	after insert or update or delete
	on public.catalog_tiers
	for each row
	execute function public.write_audit_log();

create trigger catalog_badges_write_audit
	after insert or update or delete
	on public.catalog_badges
	for each row
	execute function public.write_audit_log();

create trigger pricing_item_badges_write_audit
	after insert or update or delete
	on public.pricing_item_badges
	for each row
	execute function public.write_audit_log();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.catalog_categories
	enable row level security;

alter table public.catalog_tiers
	enable row level security;

alter table public.catalog_badges
	enable row level security;

alter table public.pricing_item_badges
	enable row level security;

-- Categorias ativas de páginas publicadas

create policy "Public can read active catalog categories"
	on public.catalog_categories
	for select
	to anon, authenticated
	using (
		is_active = true
		and exists (
			select 1
			from public.service_pages as page
			where page.id =
				catalog_categories.service_page_id
				and page.is_published = true
		)
	);

create policy "Admins can manage catalog categories"
	on public.catalog_categories
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Níveis ativos

create policy "Public can read active catalog tiers"
	on public.catalog_tiers
	for select
	to anon, authenticated
	using (
		is_active = true
	);

create policy "Admins can manage catalog tiers"
	on public.catalog_tiers
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Selos ativos

create policy "Public can read active catalog badges"
	on public.catalog_badges
	for select
	to anon, authenticated
	using (
		is_active = true
	);

create policy "Admins can manage catalog badges"
	on public.catalog_badges
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- Relações de selos pertencentes a itens públicos

create policy "Public can read active pricing item badges"
	on public.pricing_item_badges
	for select
	to anon, authenticated
	using (
		exists (
			select 1
			from public.pricing_items as item
			join public.service_pages as page
				on page.id = item.service_page_id
			join public.catalog_badges as badge
				on badge.id =
					pricing_item_badges.badge_id
			where item.id =
					pricing_item_badges.pricing_item_id
				and item.is_active = true
				and page.is_published = true
				and badge.is_active = true
		)
	);

create policy "Admins can manage pricing item badges"
	on public.pricing_item_badges
	for all
	to authenticated
	using (
		(select public.is_admin())
	)
	with check (
		(select public.is_admin())
	);

-- =========================================================
-- Permissões da API
-- =========================================================

grant usage
	on type public.catalog_item_kind
	to anon, authenticated;

grant select
	on
		public.catalog_categories,
		public.catalog_tiers,
		public.catalog_badges,
		public.pricing_item_badges
	to anon, authenticated;

grant insert, update, delete
	on
		public.catalog_categories,
		public.catalog_tiers,
		public.catalog_badges,
		public.pricing_item_badges
	to authenticated;