-- Additive editorial tables. Apply only after review, never automatically on production.
create table public.catalog_source_revisions (
 division public.service_division primary key, revision bigint not null default 0
);
insert into public.catalog_source_revisions(division) values ('home'),('game'),('data');
create table public.catalog_drafts (
 id uuid primary key default gen_random_uuid(), division public.service_division not null unique,
 revision bigint not null default 1, base_revision bigint not null,
 document jsonb not null, updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
create table public.catalog_versions (
 id uuid primary key default gen_random_uuid(), division public.service_division not null,
 source_revision bigint not null, document jsonb not null,
 created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table public.product_details (
 pricing_item_id uuid primary key references public.pricing_items(id) on delete cascade,
 division public.service_division not null, content jsonb not null,
 updated_at timestamptz not null default now(),
 constraint product_details_object check (jsonb_typeof(content)='object'),
 constraint product_details_slug check (content->>'slug' ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 constraint product_details_status check (content->>'status' in ('available','reserved','sold','unavailable'))
);
create unique index product_details_slug_unique on public.product_details ((content->>'slug'));
create index product_details_division_idx on public.product_details(division);
alter table public.catalog_source_revisions enable row level security;
alter table public.catalog_drafts enable row level security;
alter table public.catalog_versions enable row level security;
alter table public.product_details enable row level security;
revoke all on public.catalog_source_revisions,public.catalog_drafts,public.catalog_versions,public.product_details from anon,authenticated;
grant select,insert,update,delete on public.catalog_source_revisions,public.catalog_drafts,public.catalog_versions,public.product_details to authenticated;
grant select on public.product_details to anon;
create policy catalog_revision_admin on public.catalog_source_revisions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy catalog_draft_admin on public.catalog_drafts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy catalog_version_admin on public.catalog_versions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy product_detail_admin on public.product_details for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy product_detail_public on public.product_details for select to anon,authenticated using (
 exists(select 1 from public.pricing_items p join public.service_pages s on s.id=p.service_page_id
 where p.id=pricing_item_id and p.is_active and s.is_published and s.division=product_details.division)
);

-- Lock the same revision row for all legacy writes. No bypass flag can suppress conflicts.
create function public.catalog_touch_source() returns trigger language plpgsql security invoker set search_path=public as $$
declare page_id uuid; target_division public.service_division;
begin
 if tg_table_name='service_pages' then
  target_division:=case when tg_op='DELETE' then old.division else new.division end;
 elsif tg_table_name='product_details' then
  target_division:=case when tg_op='DELETE' then old.division else new.division end;
 elsif tg_table_name='pricing_item_badges' then
  select service_page_id into page_id from public.pricing_items where id=case when tg_op='DELETE' then old.pricing_item_id else new.pricing_item_id end;
 else
  page_id:=case when tg_op='DELETE' then old.service_page_id else new.service_page_id end;
 end if;
 if target_division is null then select division into target_division from public.service_pages where id=page_id; end if;
 if target_division is not null then update public.catalog_source_revisions set revision=revision+1 where division=target_division; end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function public.catalog_touch_source() from public;
create trigger catalog_prices_changed before insert or update or delete on public.pricing_items for each row execute function public.catalog_touch_source();
create trigger catalog_services_changed before insert or update or delete on public.services for each row execute function public.catalog_touch_source();
create trigger catalog_page_changed before update or delete on public.service_pages for each row execute function public.catalog_touch_source();
create trigger catalog_badges_changed before insert or update or delete on public.pricing_item_badges for each row execute function public.catalog_touch_source();
create trigger catalog_details_changed before insert or update or delete on public.product_details for each row execute function public.catalog_touch_source();

create function public.catalog_editor_snapshot(p_division public.service_division)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare page_id uuid; source_revision bigint; published jsonb; draft jsonb;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.' using errcode='42501'; end if;
 select revision into source_revision from public.catalog_source_revisions where division=p_division for update;
 select id into page_id from public.service_pages where division=p_division;
 published:=jsonb_build_object('schemaVersion',1,'division',p_division,
 'items',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('badge_ids',coalesce((select jsonb_agg(b.badge_id order by b.badge_id) from public.pricing_item_badges b where b.pricing_item_id=p.id),'[]'::jsonb)) order by p.sort_order,p.id) from public.pricing_items p where p.service_page_id=page_id),'[]'::jsonb),
 'serviceCards',coalesce((select jsonb_agg(to_jsonb(s) order by s.sort_order,s.id) from public.services s where s.service_page_id=page_id),'[]'::jsonb),
 'details',coalesce((select jsonb_object_agg(d.pricing_item_id,d.content) from public.product_details d where d.division=p_division),'{}'::jsonb));
 select jsonb_build_object('id',id,'division',division,'revision',revision,'baseRevision',base_revision,'document',document,'updatedAt',updated_at)
 into draft from public.catalog_drafts where division=p_division;
 return jsonb_build_object('ready',true,'draft',draft,'published',published,'sourceRevision',source_revision,'pageId',page_id);
end $$;

create function public.catalog_validate_document(p_document jsonb,p_division public.service_division)
returns void language plpgsql immutable security invoker set search_path=public as $$
declare item jsonb; detail record; media jsonb; key_name text; part jsonb;
begin
 if p_document->>'division' is distinct from p_division::text or p_document->>'schemaVersion' is distinct from '1'
 or jsonb_typeof(p_document->'items') is distinct from 'array'
 or jsonb_typeof(p_document->'serviceCards') is distinct from 'array'
 or jsonb_typeof(p_document->'details') is distinct from 'object' or octet_length(p_document::text)>2000000 then
 raise exception 'Documento inválido.' using errcode='22023'; end if;
 foreach key_name in array array['items','serviceCards'] loop
  if jsonb_array_length(p_document->key_name)>500 then raise exception 'Limite de itens excedido.' using errcode='22023'; end if;
  if (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(p_document->key_name) x) then raise exception 'IDs repetidos.' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(p_document->key_name) loop
   if coalesce(item->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
   or coalesce(item->>'service_page_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
   or length(trim(coalesce(item->>(case when key_name='items' then 'name' else 'title' end),''))) not between 1 and 140
   or length(trim(coalesce(item->>'description',''))) not between 1 and 1200
   or jsonb_typeof(item->'is_active') is distinct from 'boolean'
   or coalesce(item->>'sort_order','') !~ '^[0-9]+$'
   or jsonb_typeof(item->'features') is distinct from 'array' then raise exception 'Item inválido.' using errcode='22023'; end if;
   if jsonb_array_length(item->'features')>40 or exists(select 1 from jsonb_array_elements(item->'features') f where jsonb_typeof(f)<>'string' or length(f#>>'{}')>1000) then raise exception 'Recursos inválidos.' using errcode='22023'; end if;
   if key_name='items' then
    if coalesce(item->>'price_type','') not in ('fixed','starting_at','free','consultation')
    or coalesce(item->>'item_kind','') not in ('service','package','product','consulting')
    or jsonb_typeof(item->'is_featured') is distinct from 'boolean'
    or jsonb_typeof(item->'badge_ids') is distinct from 'array' then raise exception 'Preço ou classificação inválida.' using errcode='22023'; end if;
    if item->>'price_type' in ('fixed','starting_at') then
     if jsonb_typeof(item->'price') is distinct from 'number' then raise exception 'Preço obrigatório.' using errcode='22023'; end if;
     if (item->>'price')::numeric<0 or (item->>'price')::numeric>9999999999 then raise exception 'Preço fora do limite.' using errcode='22023'; end if;
    elsif item->'price' is distinct from 'null'::jsonb then raise exception 'Preço deve estar vazio.' using errcode='22023'; end if;
    if item->>'compare_at_price' is not null and ((item->>'price') is null or (item->>'compare_at_price')::numeric <= (item->>'price')::numeric) then raise exception 'Preço promocional inválido.' using errcode='22023'; end if;
   end if;
  end loop;
 end loop;
 for detail in select key,value from jsonb_each(p_document->'details') loop
  if not exists(select 1 from jsonb_array_elements(p_document->'items') i where i->>'id'=detail.key) then raise exception 'Detalhe sem produto.' using errcode='22023'; end if;
  if jsonb_typeof(detail.value) is distinct from 'object'
   or coalesce(detail.value->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(detail.value->>'slug')>100
   or coalesce(detail.value->>'status','') not in ('available','reserved','sold','unavailable')
   or coalesce(detail.value->>'modality','') not in ('physical','digital','service')
   or coalesce(detail.value->>'ctaKind','') not in ('contact','microsoft','external')
   or jsonb_typeof(detail.value->'summary') is distinct from 'string' or length(detail.value->>'summary')>1200
   or jsonb_typeof(detail.value->'body') is distinct from 'string' or length(detail.value->>'body')>20000
   or jsonb_typeof(detail.value->'version') is distinct from 'string' or length(detail.value->>'version')>80
   then raise exception 'Detalhe inválido.' using errcode='22023'; end if;
  if detail.value->>'ctaKind'='microsoft' and coalesce(detail.value->>'microsoftUrl','') !~ '^https://(appsource|marketplace)\.microsoft\.com(/|$)' then raise exception 'Link Microsoft inválido.' using errcode='22023'; end if;
  if detail.value->>'ctaKind'='external' and (coalesce(detail.value->>'externalUrl','') !~ '^https://[^/@[:space:]]+(\/|$)' or length(detail.value->>'externalUrl')>2048) then raise exception 'Link externo inválido.' using errcode='22023'; end if;
  foreach key_name in array array['features','steps','faq','media'] loop
   if jsonb_typeof(detail.value->key_name) is distinct from 'array' then raise exception 'Lista de detalhes inválida.' using errcode='22023'; end if;
   if jsonb_array_length(detail.value->key_name)>(case when key_name='media' then 12 else 40 end) then raise exception 'Limite da lista excedido.' using errcode='22023'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(detail.value->'features') f where jsonb_typeof(f)<>'string' or length(f#>>'{}')>1000) then raise exception 'Recursos inválidos.' using errcode='22023'; end if;
  for part in select value from jsonb_array_elements(detail.value->'steps') loop
   if jsonb_typeof(part->'title') is distinct from 'string' or jsonb_typeof(part->'body') is distinct from 'string' or length(part::text)>6000 then raise exception 'Etapa inválida.' using errcode='22023'; end if;
  end loop;
  for part in select value from jsonb_array_elements(detail.value->'faq') loop
   if jsonb_typeof(part->'question') is distinct from 'string' or jsonb_typeof(part->'answer') is distinct from 'string' or length(part::text)>6000 then raise exception 'Pergunta inválida.' using errcode='22023'; end if;
  end loop;
  for media in select value from jsonb_array_elements(detail.value->'media') loop
   if coalesce(media->>'type','') not in ('image','youtube','vimeo') or length(coalesce(media->>'url','')) not between 1 and 2048 or jsonb_typeof(media->'alt') is distinct from 'string' or length(media->>'alt')>500 then raise exception 'Mídia inválida.' using errcode='22023'; end if;
   if media->>'type'='image' and (length(trim(media->>'alt'))=0 or (media->>'url' !~ '^https://[^/@[:space:]]+(/|$)' and media->>'url' !~* '^storage://catalog-media/[0-9a-f-]{36}\.(png|jpg|webp)$')) then raise exception 'Imagem inválida.' using errcode='22023'; end if;
   if media->>'type'='youtube' and not (
    media->>'url' ~ '^https://(www\.|m\.)?youtube\.com/watch\?([^#]*&)?v=[A-Za-z0-9_-]{11}(&[^#]*)?(#.*)?$'
    or media->>'url' ~ '^https://(www\.|m\.)?youtube\.com/(embed|shorts)/[A-Za-z0-9_-]{11}([?#].*)?$'
    or media->>'url' ~ '^https://youtu\.be/[A-Za-z0-9_-]{11}([?#].*)?$'
   ) then raise exception 'Vídeo YouTube inválido.' using errcode='22023'; end if;
   if media->>'type'='vimeo' and media->>'url' !~ '^https://(www\.vimeo\.com|vimeo\.com|player\.vimeo\.com)/(video/)?[0-9]+([?#].*)?$' then raise exception 'Vídeo Vimeo inválido.' using errcode='22023'; end if;
  end loop;
 end loop;
 if (select count(*)<>count(distinct value->>'slug') from jsonb_each(p_document->'details')) then raise exception 'Endereços repetidos.' using errcode='22023'; end if;
end $$;
revoke all on function public.catalog_validate_document(jsonb,public.service_division) from public,anon;
grant execute on function public.catalog_validate_document(jsonb,public.service_division) to authenticated;

create function public.catalog_editor_save(p_division public.service_division,p_expected_revision bigint,p_base_revision bigint,p_document jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare d public.catalog_drafts; source_revision bigint;
begin
 if p_expected_revision is null or p_expected_revision<0 or p_base_revision is null or p_base_revision<0 then raise exception 'Revisão inválida.' using errcode='22023'; end if;
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.' using errcode='42501'; end if;
 if p_document->>'division' is distinct from p_division::text or p_document->>'schemaVersion' is distinct from '1'
 or jsonb_typeof(p_document->'items') is distinct from 'array' or jsonb_typeof(p_document->'serviceCards') is distinct from 'array'
 or jsonb_typeof(p_document->'details') is distinct from 'object' or octet_length(p_document::text)>2000000 then
 raise exception 'Documento inválido.' using errcode='22023'; end if;
 select revision into source_revision from public.catalog_source_revisions where division=p_division for update;
 select * into d from public.catalog_drafts where division=p_division for update;
 perform public.catalog_validate_document(p_document,p_division);
 if d.id is null then
  if p_expected_revision<>0 or p_base_revision<>source_revision then raise exception 'Catálogo alterado. Recarregue e compare.' using errcode='40001'; end if;
  insert into public.catalog_drafts(division,base_revision,document,updated_by) values(p_division,p_base_revision,p_document,auth.uid()) returning * into d;
 else
  if p_expected_revision<>d.revision or p_base_revision<>d.base_revision then raise exception 'Rascunho alterado em outra aba. Recarregue e compare.' using errcode='40001'; end if;
  update public.catalog_drafts set document=p_document,revision=revision+1,updated_at=now(),updated_by=auth.uid() where id=d.id returning * into d;
 end if;
 return jsonb_build_object('revision',d.revision,'draft',jsonb_build_object('id',d.id,'division',d.division,'revision',d.revision,'baseRevision',d.base_revision,'document',d.document,'updatedAt',d.updated_at));
end $$;

create function public.catalog_editor_publish(p_division public.service_division,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare d public.catalog_drafts; source_revision bigint; page_id uuid; item jsonb; detail record; item_id uuid; snapshot jsonb;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.' using errcode='42501'; end if;
 select revision into source_revision from public.catalog_source_revisions where division=p_division for update;
 select * into d from public.catalog_drafts where division=p_division for update;
 if d.id is null then raise exception 'Rascunho não encontrado.' using errcode='P0002'; end if;
 if p_expected_revision is null or p_expected_revision<>d.revision or source_revision<>d.base_revision then raise exception 'Conflito com outra edição. Recarregue e compare antes de publicar.' using errcode='40001'; end if;
 select id into page_id from public.service_pages where division=p_division;
 if page_id is null then raise exception 'Página não encontrada.' using errcode='P0002'; end if;
 perform public.catalog_validate_document(d.document,p_division);
 if exists(select 1 from public.product_details pd join jsonb_each(d.document->'details') x on x.key=pd.pricing_item_id::text
 where pd.division=p_division and pd.content->>'slug' is distinct from x.value->>'slug') then
 raise exception 'O endereço de produto publicado não pode ser alterado.' using errcode='22023'; end if;
 snapshot:=public.catalog_editor_snapshot(p_division);
 insert into public.catalog_versions(division,source_revision,document,created_by) values(p_division,source_revision,snapshot->'published',auth.uid());
 -- IDs and foreign references cannot move content from another division.
 for item in select value from jsonb_array_elements(d.document->'items') loop
  item_id:=(item->>'id')::uuid;
  if (item->>'service_page_id')::uuid is distinct from page_id or exists(select 1 from public.pricing_items where id=item_id and service_page_id<>page_id) then raise exception 'Item de outra divisão.' using errcode='22023'; end if;
  if not exists(select 1 from public.pricing_items where id=item_id) then
   insert into public.pricing_items(id,service_page_id,name,description,price_type,price,updated_by)
   values(item_id,page_id,item->>'name',item->>'description',(item->>'price_type')::public.price_type,(item->>'price')::numeric,auth.uid());
  end if;
  perform public.save_pricing_catalog_item(item_id,page_id,item->>'name',item->>'description',(item->>'price_type')::public.price_type,
   (item->>'price')::numeric,(item->>'compare_at_price')::numeric,item->>'price_prefix',item->>'price_label',item->>'price_suffix',
   item->'features',(item->>'category_id')::uuid,(item->>'tier_id')::uuid,(item->>'item_kind')::public.catalog_item_kind,item->>'note',
   (item->>'is_featured')::boolean,(item->>'is_active')::boolean,(item->>'sort_order')::integer,item->>'cta_label',item->>'cta_message',
   array(select jsonb_array_elements_text(item->'badge_ids')::uuid),auth.uid());
  -- Retain legacy badge text as well as structured badges.
  update public.pricing_items set badge=item->>'badge' where id=item_id;
 end loop;
 for item in select value from jsonb_array_elements(d.document->'serviceCards') loop
  item_id:=(item->>'id')::uuid;
  if (item->>'service_page_id')::uuid is distinct from page_id or exists(select 1 from public.services where id=item_id and service_page_id<>page_id) then raise exception 'Serviço de outra divisão.' using errcode='22023'; end if;
  if length(trim(item->>'title'))=0 or length(trim(item->>'description'))=0 then raise exception 'Serviço inválido.' using errcode='22023'; end if;
  insert into public.services(id,service_page_id,title,description,features,badge,is_active,sort_order,updated_by)
  values(item_id,page_id,item->>'title',item->>'description',item->'features',item->>'badge',(item->>'is_active')::boolean,(item->>'sort_order')::integer,auth.uid())
  on conflict(id) do update set title=excluded.title,description=excluded.description,features=excluded.features,badge=excluded.badge,is_active=excluded.is_active,sort_order=excluded.sort_order,updated_by=excluded.updated_by;
 end loop;
 delete from public.product_details where division=p_division;
 for detail in select key,value from jsonb_each(d.document->'details') loop
  if not exists(select 1 from jsonb_array_elements(d.document->'items') x where x->>'id'=detail.key) then raise exception 'Detalhe sem produto.' using errcode='22023'; end if;
  insert into public.product_details(pricing_item_id,division,content) values(detail.key::uuid,p_division,detail.value);
 end loop;
 delete from public.pricing_items where service_page_id=page_id and id not in(select (x->>'id')::uuid from jsonb_array_elements(d.document->'items') x);
 delete from public.services where service_page_id=page_id and id not in(select (x->>'id')::uuid from jsonb_array_elements(d.document->'serviceCards') x);
 select revision into source_revision from public.catalog_source_revisions where division=p_division;
 update public.catalog_drafts set base_revision=source_revision,revision=revision+1,updated_at=now(),updated_by=auth.uid() where id=d.id returning * into d;
 return jsonb_build_object('revision',d.revision,'sourceRevision',source_revision);
end $$;
revoke all on function public.catalog_editor_snapshot(public.service_division),public.catalog_editor_save(public.service_division,bigint,bigint,jsonb),public.catalog_editor_publish(public.service_division,bigint) from public,anon;
grant execute on function public.catalog_editor_snapshot(public.service_division),public.catalog_editor_save(public.service_division,bigint,bigint,jsonb),public.catalog_editor_publish(public.service_division,bigint) to authenticated;
create function public.catalog_editor_discard(p_division public.service_division,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare d public.catalog_drafts;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.' using errcode='42501'; end if;
 perform 1 from public.catalog_source_revisions where division=p_division for update;
 select * into d from public.catalog_drafts where division=p_division for update;
 if p_expected_revision is null or d.id is null or d.revision<>p_expected_revision then raise exception 'Rascunho alterado. Recarregue antes de descartar.' using errcode='40001'; end if;
 delete from public.catalog_drafts where id=d.id;
 return public.catalog_editor_snapshot(p_division);
end $$;
revoke all on function public.catalog_editor_discard(public.service_division,bigint) from public,anon;
grant execute on function public.catalog_editor_discard(public.service_division,bigint) to authenticated;
