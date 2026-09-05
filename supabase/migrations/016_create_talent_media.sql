-- Gallery and video media attached to talent profiles.
-- Cover photo remains on public.talents.foto_path/foto_url.

create table if not exists public.talent_media (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  kind text not null,
  storage_path text,
  external_url text,
  title text,
  sort_order integer not null default 0,
  active boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint talent_media_kind_check
    check (kind in ('photo', 'video')),
  constraint talent_media_source_check
    check ((storage_path is not null)::integer + (external_url is not null)::integer = 1),
  constraint talent_media_title_length
    check (title is null or char_length(title) <= 160),
  constraint talent_media_sort_order_range
    check (sort_order between 0 and 9999),
  constraint talent_media_video_external_only
    check (kind <> 'video' or external_url is not null)
);

create index if not exists talent_media_public_idx
  on public.talent_media (talent_id, active, kind, sort_order, criado_em);

create index if not exists talent_media_storage_path_idx
  on public.talent_media (storage_path)
  where storage_path is not null;

drop trigger if exists talent_media_set_atualizado_em on public.talent_media;
create trigger talent_media_set_atualizado_em
before update on public.talent_media
for each row
execute function public.set_atualizado_em();

alter table public.talent_media enable row level security;

revoke all on table public.talent_media from anon;
revoke all on table public.talent_media from authenticated;
grant select on table public.talent_media to anon;
grant select, insert, update on table public.talent_media to authenticated;

drop policy if exists "Publico visualiza midias ativas" on public.talent_media;
create policy "Publico visualiza midias ativas"
on public.talent_media
for select
to anon
using (
  active = true
  and exists (
    select 1
    from public.talents
    where talents.id = talent_media.talent_id
      and talents.ativo = true
  )
);

drop policy if exists "Autenticado visualiza midias permitidas" on public.talent_media;
create policy "Autenticado visualiza midias permitidas"
on public.talent_media
for select
to authenticated
using (
  (
    active = true
    and exists (
      select 1
      from public.talents
      where talents.id = talent_media.talent_id
        and talents.ativo = true
    )
  )
  or exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador cria midias" on public.talent_media;
create policy "Administrador cria midias"
on public.talent_media
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador edita midias" on public.talent_media;
create policy "Administrador edita midias"
on public.talent_media
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

-- Extend public photo access to gallery photos while keeping the bucket private.
drop policy if exists "Publico le fotos de talentos ativos" on storage.objects;
create policy "Publico le fotos de talentos ativos"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'talent-photos'
  and (
    exists (
      select 1
      from public.talents
      where talents.ativo = true
        and talents.foto_path = storage.objects.name
    )
    or exists (
      select 1
      from public.talent_media
      join public.talents on talents.id = talent_media.talent_id
      where talent_media.kind = 'photo'
        and talent_media.active = true
        and talent_media.storage_path = storage.objects.name
        and talents.ativo = true
    )
  )
);

comment on table public.talent_media is
  'Fotos adicionais e videos vinculados aos perfis do Casting Attual 360.';
