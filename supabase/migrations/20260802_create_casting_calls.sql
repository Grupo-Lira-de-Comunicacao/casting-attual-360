-- Casting Attual 360
-- Missao 02: Convocacoes (casting calls) e requisitos.
-- Depende do dominio de Producoes introduzido em 20260802_create_productions.sql.

create table if not exists public.casting_calls (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions(id) on delete restrict,
  title text not null,
  role_name text not null,
  description text,
  status text not null default 'draft',
  quantity integer not null default 1,
  application_deadline timestamptz,
  work_starts_at timestamptz,
  work_ends_at timestamptz,
  city text,
  state varchar(2),
  venue text,
  is_remote boolean not null default false,
  compensation_amount numeric(12,2),
  currency varchar(3) not null default 'BRL',
  compensation_notes text,
  internal_notes text,
  published_at timestamptz,
  closed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint casting_calls_title_not_blank check (char_length(trim(title)) between 2 and 180),
  constraint casting_calls_role_not_blank check (char_length(trim(role_name)) between 2 and 160),
  constraint casting_calls_status_values check (status in ('draft', 'open', 'paused', 'closed', 'cancelled')),
  constraint casting_calls_quantity_positive check (quantity between 1 and 500),
  constraint casting_calls_work_range check (work_ends_at is null or work_starts_at is null or work_ends_at >= work_starts_at),
  constraint casting_calls_compensation_nonnegative check (compensation_amount is null or compensation_amount >= 0),
  constraint casting_calls_currency_length check (char_length(currency) = 3),
  constraint casting_calls_state_length check (state is null or char_length(state) = 2)
);

create table if not exists public.casting_requirements (
  id uuid primary key default gen_random_uuid(),
  casting_call_id uuid not null references public.casting_calls(id) on delete cascade,
  requirement_type text not null,
  label text not null,
  value_text text,
  min_value numeric,
  max_value numeric,
  is_required boolean not null default true,
  weight smallint not null default 100,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint casting_requirements_type_values check (
    requirement_type in ('category', 'skill', 'specialty', 'language', 'availability', 'location', 'age_range', 'profile_attribute', 'other')
  ),
  constraint casting_requirements_label_not_blank check (char_length(trim(label)) between 2 and 160),
  constraint casting_requirements_range check (max_value is null or min_value is null or max_value >= min_value),
  constraint casting_requirements_weight check (weight between 0 and 100)
);

create index if not exists casting_calls_production_idx on public.casting_calls (production_id, created_at desc);
create index if not exists casting_calls_status_idx on public.casting_calls (status, created_at desc);
create index if not exists casting_calls_deadline_idx on public.casting_calls (application_deadline) where status = 'open';
create index if not exists casting_requirements_call_idx on public.casting_requirements (casting_call_id, sort_order, created_at);
create index if not exists casting_requirements_type_idx on public.casting_requirements (requirement_type, is_required);

create or replace function public.set_casting_call_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists casting_calls_set_updated_at on public.casting_calls;
create trigger casting_calls_set_updated_at
before update on public.casting_calls
for each row execute function public.set_casting_call_updated_at();

create or replace function public.set_casting_requirement_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists casting_requirements_set_updated_at on public.casting_requirements;
create trigger casting_requirements_set_updated_at
before update on public.casting_requirements
for each row execute function public.set_casting_requirement_updated_at();

alter table public.casting_calls enable row level security;
alter table public.casting_requirements enable row level security;

revoke all on table public.casting_calls from anon, authenticated;
revoke all on table public.casting_requirements from anon, authenticated;
grant select, insert, update on table public.casting_calls to authenticated;
grant select, insert, update, delete on table public.casting_requirements to authenticated;

drop policy if exists "Administrador gerencia convocacoes" on public.casting_calls;
create policy "Administrador gerencia convocacoes"
on public.casting_calls
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Administrador gerencia requisitos" on public.casting_requirements;
create policy "Administrador gerencia requisitos"
on public.casting_requirements
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

alter table public.integration_events
  add column if not exists casting_call_id uuid references public.casting_calls(id) on delete set null;

create index if not exists integration_events_casting_call_idx
  on public.integration_events (casting_call_id, criado_em desc);

comment on table public.casting_calls is
  'Convocacoes de elenco vinculadas a uma producao do Casting Attual 360.';
comment on table public.casting_requirements is
  'Criterios estruturados de uma convocacao; requisitos obrigatorios e preferencias devem permanecer distinguiveis.';
comment on column public.casting_calls.status is
  'draft nao e distribuido; open pode alimentar busca, shortlist e notificacoes; paused suspende distribuicao; closed e cancelled encerram o fluxo.';
comment on column public.integration_events.casting_call_id is
  'Referencia opcional da convocacao relacionada ao evento enviado ao ATTUAL ONE.';
