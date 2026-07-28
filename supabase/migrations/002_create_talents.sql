create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon;
revoke all on table public.admin_users from authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "Admin pode consultar a propria permissao" on public.admin_users;
create policy "Admin pode consultar a propria permissao"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

create table if not exists public.talents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  nome_artistico text,
  categoria text not null,
  subcategorias text[] not null default '{}',
  cidade text not null,
  estado varchar(2) not null,
  biografia text not null,
  habilidades text[] not null default '{}',
  foto_url text,
  foto_path text,
  instagram text,
  telefone text,
  email text,
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint talents_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint talents_nome_length
    check (char_length(nome) between 2 and 160),
  constraint talents_nome_artistico_length
    check (nome_artistico is null or char_length(nome_artistico) <= 160),
  constraint talents_categoria_length
    check (char_length(categoria) between 2 and 100),
  constraint talents_cidade_length
    check (char_length(cidade) between 2 and 120),
  constraint talents_estado_format
    check (estado ~ '^[A-Z]{2}$'),
  constraint talents_biografia_length
    check (char_length(biografia) between 20 and 5000),
  constraint talents_email_format
    check (
      email is null
      or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    ),
  constraint talents_ordem_range
    check (ordem between 0 and 9999),
  constraint talents_photo_source
    check (foto_url is null or foto_path is null)
);

create index if not exists talents_public_catalog_idx
  on public.talents (ativo, ordem, nome);

create index if not exists talents_featured_idx
  on public.talents (destaque, ativo, ordem);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists talents_set_atualizado_em on public.talents;
create trigger talents_set_atualizado_em
before update on public.talents
for each row
execute function public.set_atualizado_em();

alter table public.talents enable row level security;

revoke all on table public.talents from anon;
revoke all on table public.talents from authenticated;
grant select on table public.talents to anon;
grant select, insert, update on table public.talents to authenticated;

drop policy if exists "Publico visualiza talentos ativos" on public.talents;
create policy "Publico visualiza talentos ativos"
on public.talents
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

drop policy if exists "Administrador cria talentos" on public.talents;
create policy "Administrador cria talentos"
on public.talents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador edita talentos" on public.talents;
create policy "Administrador edita talentos"
on public.talents
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

comment on table public.admin_users is
  'Lista explicita de usuarios do Supabase Auth autorizados a administrar o Casting Attual 360.';

comment on table public.talents is
  'Perfis reais e demonstrativos gerenciados pelo painel administrativo do Casting Attual 360.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'talent-photos',
  'talent-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Publico le fotos de talentos ativos" on storage.objects;
create policy "Publico le fotos de talentos ativos"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'talent-photos'
  and exists (
    select 1
    from public.talents
    where talents.ativo = true
      and talents.foto_path = storage.objects.name
  )
);

drop policy if exists "Administrador le todas as fotos" on storage.objects;
create policy "Administrador le todas as fotos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'talent-photos'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador envia fotos" on storage.objects;
create policy "Administrador envia fotos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'talent-photos'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador atualiza fotos" on storage.objects;
create policy "Administrador atualiza fotos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'talent-photos'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'talent-photos'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

-- Exclusao definitiva nao e concedida. Para retirar um perfil do catalogo,
-- o painel atualiza public.talents.ativo para false.

