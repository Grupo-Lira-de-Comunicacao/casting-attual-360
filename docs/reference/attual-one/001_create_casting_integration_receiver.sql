-- ATTUAL ONE — implementação de referência para receber eventos do Casting Attual 360
-- Copiar para o projeto Supabase do ATTUAL ONE como migration.

create extension if not exists pgcrypto;

create table if not exists public.received_integration_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  event_version integer not null default 1 check (event_version > 0),
  source_system text not null,
  destination_system text not null default 'attual-one',
  organization_external_id text,
  project_external_id text,
  subject_external_id text,
  payload jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb,
  status text not null default 'received'
    check (status in ('received', 'processing', 'completed', 'failed', 'ignored')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_received_integration_events_queue
  on public.received_integration_events (status, received_at);

create index if not exists idx_received_integration_events_type
  on public.received_integration_events (event_type, received_at desc);

create table if not exists public.casting_talent_integrations (
  id uuid primary key default gen_random_uuid(),
  source_system text not null default 'casting-attual-360',
  talent_external_id text not null,
  organization_external_id text,
  project_external_id text,
  telegram_user_id text,
  telegram_chat_id text,
  telegram_linked_at timestamptz,
  sync_status text not null default 'active'
    check (sync_status in ('active', 'inactive', 'blocked', 'error')),
  last_event_key text,
  last_event_type text,
  last_sync_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_system, talent_external_id)
);

create index if not exists idx_casting_talent_integrations_telegram
  on public.casting_talent_integrations (telegram_user_id)
  where telegram_user_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_received_integration_events_updated_at
  on public.received_integration_events;
create trigger trg_received_integration_events_updated_at
before update on public.received_integration_events
for each row execute function public.set_updated_at();

drop trigger if exists trg_casting_talent_integrations_updated_at
  on public.casting_talent_integrations;
create trigger trg_casting_talent_integrations_updated_at
before update on public.casting_talent_integrations
for each row execute function public.set_updated_at();

alter table public.received_integration_events enable row level security;
alter table public.casting_talent_integrations enable row level security;

-- O receptor deve usar a service role somente no backend.
-- Não criar política pública de insert/update para estas tabelas.

comment on table public.received_integration_events is
  'Caixa de entrada idempotente para eventos externos recebidos pelo ATTUAL ONE.';

comment on table public.casting_talent_integrations is
  'Índice mínimo de talentos do Casting conhecidos pelo ATTUAL ONE, sem duplicar o cadastro mestre.';
