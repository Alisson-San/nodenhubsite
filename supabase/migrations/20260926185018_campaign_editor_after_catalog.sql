-- Additive. Apply only after visual catalogue foundation; no production seed.
create table public.campaign_drafts (
 id uuid primary key, revision integer not null default 1 check(revision>0),
 content jsonb not null check(jsonb_typeof(content)='object'),
 updated_at timestamptz not null default now()
);
create table public.campaigns (
 id uuid primary key, content jsonb not null check(jsonb_typeof(content)='object'),
 published_at timestamptz not null default now()
);
alter table public.campaign_drafts enable row level security;
alter table public.campaigns enable row level security;
revoke all on public.campaign_drafts,public.campaigns from anon,authenticated;
grant select,insert,update,delete on public.campaign_drafts,public.campaigns to authenticated;
grant select on public.campaigns to anon;
create policy campaign_drafts_admin on public.campaign_drafts for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy campaigns_admin on public.campaigns for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy campaigns_public on public.campaigns for select to anon,authenticated using(
 content->>'active'='true'
 and (nullif(content->>'startsAt','') is null or (content->>'startsAt')::timestamptz<=now())
 and (nullif(content->>'endsAt','') is null or (content->>'endsAt')::timestamptz>now())
 and (nullif(content->>'productId','') is null or exists(
  select 1 from public.pricing_items p join public.service_pages sp on sp.id=p.service_page_id
  left join public.product_details pd on pd.pricing_item_id=p.id
  where p.id::text=campaigns.content->>'productId' and p.is_active and sp.is_published
   and coalesce(pd.content->>'status','available')='available'
 ))
);
create or replace function public.edit_campaign(p_id uuid,p_expected_revision integer,p_action text,p_content jsonb default null)
returns integer language plpgsql security invoker set search_path=public as $$
declare current_draft public.campaign_drafts; next_content jsonb; v integer;
begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_action not in ('save','publish','unpublish','reset') then raise exception 'Ação inválida'; end if;
 select * into current_draft from public.campaign_drafts where id=p_id for update;
 if not found then
  if p_expected_revision<>0 or p_action<>'save' then raise exception 'Conflito de revisão' using errcode='40001'; end if;
  next_content=jsonb_set(p_content,'{displayVersion}','1'::jsonb);
  insert into public.campaign_drafts(id,content) values(p_id,next_content);
  return 1;
 end if;
 if current_draft.revision<>p_expected_revision then raise exception 'Conflito de revisão' using errcode='40001'; end if;
 next_content=current_draft.content;
 if p_action='save' then
  next_content=jsonb_set(p_content,'{displayVersion}',coalesce(current_draft.content->'displayVersion','1'::jsonb));
 elsif p_action='reset' then
  next_content=jsonb_set(next_content,'{displayVersion}',to_jsonb(coalesce((next_content->>'displayVersion')::integer,1)+1));
 elsif p_action='publish' then
  if nullif(next_content->>'productId','') is not null and not exists(
   select 1 from public.pricing_items p join public.service_pages sp on sp.id=p.service_page_id
   left join public.product_details pd on pd.pricing_item_id=p.id
   where p.id::text=next_content->>'productId' and p.is_active and sp.is_published
    and coalesce(pd.content->>'status','available')='available'
  ) then raise exception 'Produto não está publicado e disponível'; end if;
  insert into public.campaigns(id,content) values(p_id,next_content)
  on conflict(id) do update set content=excluded.content,published_at=now();
 elsif p_action='unpublish' then delete from public.campaigns where id=p_id;
 end if;
 v=current_draft.revision+1;
 update public.campaign_drafts set content=next_content,revision=v,updated_at=now() where id=p_id;
 return v;
end $$;
revoke all on function public.edit_campaign(uuid,integer,text,jsonb) from public,anon;
grant execute on function public.edit_campaign(uuid,integer,text,jsonb) to authenticated;
