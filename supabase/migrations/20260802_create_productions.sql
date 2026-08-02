-- Casting Attual 360
-- Missao 01: dominio de Producoes.
-- Migration aditiva e compativel com a estrutura administrativa existente.

create table if not exists public.productions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  production_type text not null default 'other',
  client_name text,
  project_reference text,
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  city text,
  state varchar(2),
  venue text,
  address text,
  is_remote boolean not null default false,
  responsible_user_id uuid references auth.users(id) on delete set null,
  budget_casting numeric(12,2),
  currency varchar(3) not null default 'BRL',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  constraint productions_name_not_blank check (char_length(trim(name)) between 2 and 160),
  constraint productions_type_values check (
    production_type in ('tv', 'advertising', 'institutional', 'photography', 'event', 'music', 'audiovisual', 'digital', 'other')
  ),
  constraint productions_status_values check (
    status in ('draft', 'planning', 'casting', 'pre_production', 'in_production', 'post_production', 'completed', 'cancelled', 'archived')
  ),
  constraint productions_date_range check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint productions_budget_nonnegative check (budget_casting is null or budget_casting >= 0),
  constraint productions_currency_length check (char_length(currency) = 3),
  constraint productions_state_length check (state is null or char_length(state) = 2)
);

create index if not exists productions_status_idx on public.productions (status, created_at desc);
create index if not exists productions_starts_at_idx on public.productions (starts_at);
create index if not exists productions_responsible_idx on public.productions (responsible_user_id);
create index if not exists productions_created_at_idx on public.productions (created_at desc);

create or replace function public.set_production_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists productions_set_updated_at on public.productions;
create trigger productions_set_updated_at
before update on public.productions
for each row execute function public.set_production_updated_at();

alter table public.productions enable row level security;
revoke all on table public.productions from anon, authenticated;
grant select, insert, update on table public.productions to authenticated;

drop policy if exists "Administrador gerencia producoes" on public.productions;
create policy "Administrador gerencia producoes"
on public.productions
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
  add column if not exists production_id uuid references public.productions(id) on delete set null;

create index if not exists integration_events_production_idx
  on public.integration_events (production_id, criado_em desc);

comment on table public.productions is
  'Raiz operacional das producoes do Casting Attual 360.';
comment on column public.productions.status is
  'Etapa operacional controlada da producao; exclusao fisica nao faz parte do fluxo administrativo.';
comment on column public.integration_events.production_id is
  'Referencia opcional da producao relacionada ao evento enviado ao ATTUAL ONE.';
