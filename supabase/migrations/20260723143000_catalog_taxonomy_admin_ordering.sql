-- =========================================================
-- Catálogo 2.0 — ordenação administrativa da taxonomia
-- =========================================================

create or replace function public.move_catalog_category(
	p_item_id uuid,
	p_direction integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_service_page_id uuid;
	v_ids uuid[];
	v_current_position integer;
	v_target_position integer;
	v_target_id uuid;
begin
	if not public.is_admin() then
		raise exception 'Acesso administrativo necessário.'
			using errcode = '42501';
	end if;

	if p_direction not in (-1, 1) then
		raise exception 'Direção inválida.'
			using errcode = '22023';
	end if;

	select service_page_id
	into v_service_page_id
	from public.catalog_categories
	where id = p_item_id;

	if v_service_page_id is null then
		return false;
	end if;

	perform 1
	from public.catalog_categories
	where service_page_id = v_service_page_id
	for update;

	select array_agg(
		id
		order by
			sort_order,
			created_at,
			id
	)
	into v_ids
	from public.catalog_categories
	where service_page_id = v_service_page_id;

	v_current_position =
		array_position(
			v_ids,
			p_item_id
		);

	if v_current_position is null then
		return false;
	end if;

	v_target_position =
		v_current_position +
		p_direction;

	if
		v_target_position < 1
		or v_target_position >
			coalesce(
				array_length(v_ids, 1),
				0
			)
	then
		return true;
	end if;

	v_target_id =
		v_ids[v_target_position];

	v_ids[v_target_position] =
		p_item_id;

	v_ids[v_current_position] =
		v_target_id;

	update public.catalog_categories
		as category
	set
		sort_order =
			(
				(ordered.position - 1) *
				10
			)::integer,

		updated_by =
			auth.uid()
	from unnest(v_ids)
		with ordinality
		as ordered(id, position)
	where
		category.id = ordered.id
		and category.sort_order
			is distinct from
			(
				(ordered.position - 1) *
					10
			)::integer;

	return true;
end;
$$;

create or replace function public.move_catalog_tier(
	p_item_id uuid,
	p_direction integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_ids uuid[];
	v_current_position integer;
	v_target_position integer;
	v_target_id uuid;
begin
	if not public.is_admin() then
		raise exception 'Acesso administrativo necessário.'
			using errcode = '42501';
	end if;

	if p_direction not in (-1, 1) then
		raise exception 'Direção inválida.'
			using errcode = '22023';
	end if;

	if not exists (
		select 1
		from public.catalog_tiers
		where id = p_item_id
	) then
		return false;
	end if;

	perform 1
	from public.catalog_tiers
	for update;

	select array_agg(
		id
		order by
			sort_order,
			created_at,
			id
	)
	into v_ids
	from public.catalog_tiers;

	v_current_position =
		array_position(
			v_ids,
			p_item_id
		);

	if v_current_position is null then
		return false;
	end if;

	v_target_position =
		v_current_position +
		p_direction;

	if
		v_target_position < 1
		or v_target_position >
			coalesce(
				array_length(v_ids, 1),
				0
			)
	then
		return true;
	end if;

	v_target_id =
		v_ids[v_target_position];

	v_ids[v_target_position] =
		p_item_id;

	v_ids[v_current_position] =
		v_target_id;

	update public.catalog_tiers
		as tier
	set
		sort_order =
			(
				(ordered.position - 1) *
				10
			)::integer,

		updated_by =
			auth.uid()
	from unnest(v_ids)
		with ordinality
		as ordered(id, position)
	where
		tier.id = ordered.id
		and tier.sort_order
			is distinct from
			(
				(ordered.position - 1) *
					10
			)::integer;

	return true;
end;
$$;

create or replace function public.move_catalog_badge(
	p_item_id uuid,
	p_direction integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_ids uuid[];
	v_current_position integer;
	v_target_position integer;
	v_target_id uuid;
begin
	if not public.is_admin() then
		raise exception 'Acesso administrativo necessário.'
			using errcode = '42501';
	end if;

	if p_direction not in (-1, 1) then
		raise exception 'Direção inválida.'
			using errcode = '22023';
	end if;

	if not exists (
		select 1
		from public.catalog_badges
		where id = p_item_id
	) then
		return false;
	end if;

	perform 1
	from public.catalog_badges
	for update;

	select array_agg(
		id
		order by
			sort_order,
			created_at,
			id
	)
	into v_ids
	from public.catalog_badges;

	v_current_position =
		array_position(
			v_ids,
			p_item_id
		);

	if v_current_position is null then
		return false;
	end if;

	v_target_position =
		v_current_position +
		p_direction;

	if
		v_target_position < 1
		or v_target_position >
			coalesce(
				array_length(v_ids, 1),
				0
			)
	then
		return true;
	end if;

	v_target_id =
		v_ids[v_target_position];

	v_ids[v_target_position] =
		p_item_id;

	v_ids[v_current_position] =
		v_target_id;

	update public.catalog_badges
		as badge
	set
		sort_order =
			(
				(ordered.position - 1) *
				10
			)::integer,

		updated_by =
			auth.uid()
	from unnest(v_ids)
		with ordinality
		as ordered(id, position)
	where
		badge.id = ordered.id
		and badge.sort_order
			is distinct from
			(
				(ordered.position - 1) *
					10
			)::integer;

	return true;
end;
$$;

revoke all
	on function public.move_catalog_category(
		uuid,
		integer
	)
	from public;

revoke all
	on function public.move_catalog_tier(
		uuid,
		integer
	)
	from public;

revoke all
	on function public.move_catalog_badge(
		uuid,
		integer
	)
	from public;

grant execute
	on function public.move_catalog_category(
		uuid,
		integer
	)
	to authenticated;

grant execute
	on function public.move_catalog_tier(
		uuid,
		integer
	)
	to authenticated;

grant execute
	on function public.move_catalog_badge(
		uuid,
		integer
	)
	to authenticated;
