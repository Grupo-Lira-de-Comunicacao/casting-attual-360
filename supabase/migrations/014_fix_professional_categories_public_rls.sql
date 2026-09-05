-- Corrige a leitura publica de professional_categories sem exigir acesso de anon a admin_users.
-- Mantem administradores autenticados capazes de visualizar categorias inativas.

drop policy if exists "Publico visualiza categorias ativas" on public.professional_categories;
drop policy if exists "Usuarios visualizam categorias permitidas" on public.professional_categories;

create policy "Publico visualiza categorias ativas"
on public.professional_categories
for select
to anon
using (ativo = true);

create policy "Usuarios visualizam categorias permitidas"
on public.professional_categories
for select
to authenticated
using (
  ativo = true
  or exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
