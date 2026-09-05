create table if not exists public.professional_categories (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  aliases text[] not null default '{}',
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint professional_categories_nome_length
    check (char_length(nome) between 2 and 80),
  constraint professional_categories_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint professional_categories_ordem_range
    check (ordem between 0 and 9999),
  constraint professional_categories_aliases_limit
    check (cardinality(aliases) <= 30)
);

create unique index if not exists professional_categories_nome_unique_idx
  on public.professional_categories (lower(nome));

create index if not exists professional_categories_public_idx
  on public.professional_categories (ativo, ordem, nome);

drop trigger if exists professional_categories_set_atualizado_em on public.professional_categories;
create trigger professional_categories_set_atualizado_em
before update on public.professional_categories
for each row
execute function public.set_atualizado_em();

alter table public.professional_categories enable row level security;

revoke all on table public.professional_categories from anon;
revoke all on table public.professional_categories from authenticated;
grant select on table public.professional_categories to anon;
grant select, insert, update, delete on table public.professional_categories to authenticated;

drop policy if exists "Publico visualiza categorias ativas" on public.professional_categories;
create policy "Publico visualiza categorias ativas"
on public.professional_categories
for select
to anon, authenticated
using (
  ativo = true
  or exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador cria categorias" on public.professional_categories;
create policy "Administrador cria categorias"
on public.professional_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador edita categorias" on public.professional_categories;
create policy "Administrador edita categorias"
on public.professional_categories
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador exclui categorias" on public.professional_categories;
create policy "Administrador exclui categorias"
on public.professional_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

insert into public.professional_categories (nome, slug, aliases, ordem, ativo)
values
  ('Apresentador', 'apresentador', array['apresentador', 'apresentadora', 'apresentacao'], 10, true),
  ('Audiovisual', 'audiovisual', array['audiovisual', 'videomaker', 'cinegrafista', 'video', 'captacao'], 20, true),
  ('Dança', 'danca', array['danca', 'coreografo', 'coreografa'], 30, true),
  ('Fotografia', 'fotografia', array['fotografia', 'fotografo', 'fotografa'], 40, true),
  ('Imagens Aereas', 'imagens-aereas', array['imagens aereas', 'imagem aerea', 'fotografia aerea', 'filmagem aerea', 'drone', 'drones'], 50, true),
  ('Influêncer', 'influencer', array['influencer', 'influenciador', 'influenciadora', 'influencia'], 60, true),
  ('Jornalismo', 'jornalismo', array['jornalismo', 'jornalista'], 70, true),
  ('Locução', 'locucao', array['locucao', 'locutor', 'locutora'], 80, true),
  ('Moda', 'moda', array['moda', 'modelo'], 90, true),
  ('Reporter', 'reporter', array['reporter', 'reportagem'], 100, true)
on conflict (slug) do nothing;

comment on table public.professional_categories is
  'Categorias editaveis exibidas como filtros no catalogo publico do Casting Attual 360.';
