-- =========================================================
-- Catálogo 2.0 — salvamento transacional de itens e selos
-- =========================================================

create or replace function public.save_pricing_catalog_item(
	p_pricing_id uuid,
	p_service_page_id uuid,
	p_name text,
	p_description text,
	p_price_type public.price_type,
	p_price numeric,
	p_compare_at_price numeric,
	p_price_prefix text,
	p_price_label text,
	p_price_suffix text,
	p_features jsonb,
	p_category_id uuid,
	p_tier_id uuid,
	p_item_kind public.catalog_item_kind,
	p_note text,
	p_is_featured boolean,
	p_is_active boolean,
	p_sort_order integer,
	p_cta_label text,
	p_cta_message text,
	p_badge_ids uuid[],
	p_updated_by uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_item_id uuid;
	v_actor_id uuid;
	v_is_service_role boolean;
begin
	if not public.is_admin() then
		raise exception 'Acesso administrativo necessário.'
			using errcode = '42501';
	end if;

	v_is_service_role =
		coalesce(
			auth.role() = 'service_role',
			false
		);

	v_actor_id =
		coalesce(
			auth.uid(),
			p_updated_by
		);

	if v_actor_id is null then
		raise exception 'Usuário responsável não informado.'
			using errcode = '22023';
	end if;

	if
		not v_is_service_role
		and auth.uid() is distinct from p_updated_by
	then
		raise exception 'Usuário responsável inválido.'
			using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.service_pages
		where id = p_service_page_id
	) then
		raise exception 'Página de serviço não encontrada.'
			using errcode = '23503';
	end if;

	if
		p_name is null
		or length(trim(p_name)) = 0
		or p_description is null
		or length(trim(p_description)) = 0
		or p_sort_order < 0
	then
		raise exception 'Dados obrigatórios inválidos.'
			using errcode = '22023';
	end if;

	if
		p_price_type in (
			'fixed',
			'starting_at'
		)
		and p_price is null
	then
		raise exception 'O tipo de preço exige um valor.'
			using errcode = '22023';
	end if;

	if
		p_price_type in (
			'consultation',
			'free'
		)
		and p_price is not null
	then
		raise exception 'O tipo de preço não aceita valor numérico.'
			using errcode = '22023';
	end if;

	if
		p_price is not null
		and p_price < 0
	then
		raise exception 'Preço inválido.'
			using errcode = '22023';
	end if;

	if
		p_compare_at_price is not null
		and (
			p_price is null
			or p_compare_at_price <= p_price
		)
	then
		raise exception 'O preço anterior precisa ser maior que o preço atual.'
			using errcode = '22023';
	end if;

	if
		p_category_id is not null
		and not exists (
			select 1
			from public.catalog_categories
			where
				id = p_category_id
				and service_page_id =
					p_service_page_id
		)
	then
		raise exception 'Categoria incompatível com a divisão.'
			using errcode = '23503';
	end if;

	if
		p_tier_id is not null
		and not exists (
			select 1
			from public.catalog_tiers
			where id = p_tier_id
		)
	then
		raise exception 'Nível não encontrado.'
			using errcode = '23503';
	end if;

	if exists (
		select 1
		from unnest(
			coalesce(
				p_badge_ids,
				array[]::uuid[]
			)
		) as selected_badge(id)
		left join public.catalog_badges
			as badge
			on badge.id =
				selected_badge.id
		where badge.id is null
	) then
		raise exception 'Um ou mais selos não foram encontrados.'
			using errcode = '23503';
	end if;

	if p_pricing_id is null then
		insert into public.pricing_items (
			service_page_id,
			name,
			description,
			price_type,
			price,
			compare_at_price,
			price_prefix,
			price_label,
			price_suffix,
			features,
			category_id,
			tier_id,
			item_kind,
			badge,
			note,
			is_featured,
			is_active,
			sort_order,
			cta_label,
			cta_message,
			updated_by
		)
		values (
			p_service_page_id,
			trim(p_name),
			trim(p_description),
			p_price_type,
			p_price,
			p_compare_at_price,
			nullif(trim(p_price_prefix), ''),
			nullif(trim(p_price_label), ''),
			nullif(trim(p_price_suffix), ''),
			coalesce(
				p_features,
				'[]'::jsonb
			),
			p_category_id,
			p_tier_id,
			p_item_kind,
			null,
			nullif(trim(p_note), ''),
			coalesce(
				p_is_featured,
				false
			),
			coalesce(
				p_is_active,
				true
			),
			p_sort_order,
			nullif(trim(p_cta_label), ''),
			nullif(trim(p_cta_message), ''),
			v_actor_id
		)
		returning id
		into v_item_id;
	else
		update public.pricing_items
		set
			name = trim(p_name),
			description = trim(p_description),
			price_type = p_price_type,
			price = p_price,
			compare_at_price = p_compare_at_price,
			price_prefix = nullif(trim(p_price_prefix), ''),
			price_label = nullif(trim(p_price_label), ''),
			price_suffix = nullif(trim(p_price_suffix), ''),
			features = coalesce(p_features, '[]'::jsonb),
			category_id = p_category_id,
			tier_id = p_tier_id,
			item_kind = p_item_kind,
			badge = null,
			note = nullif(trim(p_note), ''),
			is_featured = coalesce(p_is_featured, false),
			is_active = coalesce(p_is_active, true),
			sort_order = p_sort_order,
			cta_label = nullif(trim(p_cta_label), ''),
			cta_message = nullif(trim(p_cta_message), ''),
			updated_by = v_actor_id
		where
			id = p_pricing_id
			and service_page_id = p_service_page_id
		returning id
		into v_item_id;

		if v_item_id is null then
			raise exception 'Item de preço não encontrado.'
				using errcode = 'P0002';
		end if;
	end if;

	delete from public.pricing_item_badges
	where pricing_item_id = v_item_id;

	with selected_badges as (
		select
			selected.id as badge_id,
			min(selected.position) as position
		from unnest(
			coalesce(
				p_badge_ids,
				array[]::uuid[]
			)
		)
		with ordinality
			as selected(id, position)
		group by selected.id
	)
	insert into public.pricing_item_badges (
		pricing_item_id,
		badge_id,
		sort_order,
		updated_by
	)
	select
		v_item_id,
		selected_badges.badge_id,
		((selected_badges.position - 1) * 10)::integer,
		v_actor_id
	from selected_badges
	order by selected_badges.position;

	return v_item_id;
end;
$$;

revoke all
	on function public.save_pricing_catalog_item(
		uuid,
		uuid,
		text,
		text,
		public.price_type,
		numeric,
		numeric,
		text,
		text,
		text,
		jsonb,
		uuid,
		uuid,
		public.catalog_item_kind,
		text,
		boolean,
		boolean,
		integer,
		text,
		text,
		uuid[],
		uuid
	)
	from public;

grant execute
	on function public.save_pricing_catalog_item(
		uuid,
		uuid,
		text,
		text,
		public.price_type,
		numeric,
		numeric,
		text,
		text,
		text,
		jsonb,
		uuid,
		uuid,
		public.catalog_item_kind,
		text,
		boolean,
		boolean,
		integer,
		text,
		text,
		uuid[],
		uuid
	)
	to authenticated, service_role;
