create or replace function public.move_service_item(
	p_item_id uuid,
	p_direction integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_page_id uuid;
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
	into v_page_id
	from public.services
	where id = p_item_id;

	if v_page_id is null then
		return false;
	end if;

	perform 1
	from public.services
	where service_page_id = v_page_id
	for update;

	select array_agg(
		id
		order by
			sort_order,
			created_at,
			id
	)
	into v_ids
	from public.services
	where service_page_id = v_page_id;

	v_current_position :=
		array_position(
			v_ids,
			p_item_id
		);

	if v_current_position is null then
		return false;
	end if;

	v_target_position :=
		v_current_position +
		p_direction;

	if
		v_target_position < 1
		or
		v_target_position >
			coalesce(
				array_length(v_ids, 1),
				0
			)
	then
		return true;
	end if;

	v_target_id :=
		v_ids[v_target_position];

	v_ids[v_target_position] :=
		p_item_id;

	v_ids[v_current_position] :=
		v_target_id;

	update public.services as service
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
		service.id = ordered.id
		and service.sort_order
			is distinct from
			(
				(ordered.position - 1) *
					10
			)::integer;

	return true;
end;
$$;

create or replace function public.move_pricing_item(
	p_item_id uuid,
	p_direction integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_page_id uuid;
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
	into v_page_id
	from public.pricing_items
	where id = p_item_id;

	if v_page_id is null then
		return false;
	end if;

	perform 1
	from public.pricing_items
	where service_page_id = v_page_id
	for update;

	select array_agg(
		id
		order by
			sort_order,
			created_at,
			id
	)
	into v_ids
	from public.pricing_items
	where service_page_id = v_page_id;

	v_current_position :=
		array_position(
			v_ids,
			p_item_id
		);

	if v_current_position is null then
		return false;
	end if;

	v_target_position :=
		v_current_position +
		p_direction;

	if
		v_target_position < 1
		or
		v_target_position >
			coalesce(
				array_length(v_ids, 1),
				0
			)
	then
		return true;
	end if;

	v_target_id :=
		v_ids[v_target_position];

	v_ids[v_target_position] :=
		p_item_id;

	v_ids[v_current_position] :=
		v_target_id;

	update public.pricing_items as pricing
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
		pricing.id = ordered.id
		and pricing.sort_order
			is distinct from
			(
				(ordered.position - 1) *
					10
			)::integer;

	return true;
end;
$$;

revoke all
	on function public.move_service_item(
		uuid,
		integer
	)
	from public;

revoke all
	on function public.move_pricing_item(
		uuid,
		integer
	)
	from public;

grant execute
	on function public.move_service_item(
		uuid,
		integer
	)
	to authenticated;

grant execute
	on function public.move_pricing_item(
		uuid,
		integer
	)
	to authenticated;