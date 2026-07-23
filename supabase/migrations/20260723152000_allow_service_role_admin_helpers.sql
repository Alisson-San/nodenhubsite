-- =========================================================
-- Permite que o cliente secreto do servidor execute
-- as funções administrativas durante ferramentas internas.
-- O papel service_role continua restrito à chave secreta.
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
	select
		coalesce(
			auth.role() =
				'service_role',
			false
		)
		or
		coalesce(
			(
				auth.jwt()
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
	to
		anon,
		authenticated,
		service_role;
