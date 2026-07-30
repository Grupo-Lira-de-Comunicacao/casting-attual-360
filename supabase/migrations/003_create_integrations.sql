-- Casting Attual 360
-- Base de integracao com Telegram e ATTUAL ONE.
-- Execute somente depois de 001_create_requests.sql e 002_create_talents.sql.

create table if not exists public.talent_telegram_accounts (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  telegram_user_id bigint not null unique,
  telegram_chat_id bigint not null,
  telegram_username text,
  primeiro_nome text,
  ultimo_nome text,
  idioma varchar(10),
  consentimento_mensagens boolean not null default false,
  consentimento_em timestamptz,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint talent_telegram_username_length
    check (telegram_username is null or char_length(telegram_username) <= 64),
  constraint talent_telegram_consentimento_data
    check (
      (consentimento_mensagens = false)
      or consentimento_em is not null
    )
);

create unique index if not exists talent_telegram_accounts_talent_idx
  on public.talent_telegram_accounts (talent_id)
  where ativo = true;

create index if not exists talent_telegram_accounts_chat_idx
  on public.talent_telegram_accounts (telegram_chat_id, ativo);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  event_key uuid not null default gen_random_uuid() unique,
  event_type text not null,
  source_system text not null,
  target_system text not null,
  organization_external_id text,
  project_external_id text,
  talent_id uuid references public.talents(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendente',
  tentativas integer not null default 0,
  ultimo_erro text,
  processado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint integration_events_type_length
    check (char_length(event_type) between 3 and 120),
  constraint integration_events_source_length
    check (char_length(source_system) between 2 and 80),
  constraint integration_events_target_length
    check (char_length(target_system) between 2 and 80),
  constraint integration_events_status_values
    check (status in ('pendente', 'processando', 'processado', 'falhou', 'cancelado')),
  constraint integration_events_attempts_range
    check (tentativas between 0 and 100)
);

create index if not exists integration_events_queue_idx
  on public.integration_events (status, criado_em);

create index if not exists integration_events_external_refs_idx
  on public.integration_events (organization_external_id, project_external_id);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid references public.talents(id) on delete set null,
  telegram_account_id uuid references public.talent_telegram_accounts(id) on delete set null,
  integration_event_id uuid references public.integration_events(id) on delete set null,
  channel text not null default 'telegram',
  template_key text not null,
  destination text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendente',
  provider_message_id text,
  tentativas integer not null default 0,
  ultimo_erro text,
  enviado_em timestamptz,
  entregue_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint notification_channel_values
    check (channel in ('telegram', 'email', 'whatsapp', 'web')),
  constraint notification_status_values
    check (status in ('pendente', 'processando', 'enviado', 'entregue', 'falhou', 'cancelado')),
  constraint notification_attempts_range
    check (tentativas between 0 and 100),
  constraint notification_template_length
    check (char_length(template_key) between 2 and 120)
);

create index if not exists notification_deliveries_queue_idx
  on public.notification_deliveries (channel, status, criado_em);

create or replace function public.set_integration_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists talent_telegram_accounts_set_updated_at on public.talent_telegram_accounts;
create trigger talent_telegram_accounts_set_updated_at
before update on public.talent_telegram_accounts
for each row execute function public.set_integration_updated_at();

drop trigger if exists integration_events_set_updated_at on public.integration_events;
create trigger integration_events_set_updated_at
before update on public.integration_events
for each row execute function public.set_integration_updated_at();

drop trigger if exists notification_deliveries_set_updated_at on public.notification_deliveries;
create trigger notification_deliveries_set_updated_at
before update on public.notification_deliveries
for each row execute function public.set_integration_updated_at();

alter table public.talent_telegram_accounts enable row level security;
alter table public.integration_events enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on table public.talent_telegram_accounts from anon, authenticated;
revoke all on table public.integration_events from anon, authenticated;
revoke all on table public.notification_deliveries from anon, authenticated;

grant select, insert, update on table public.talent_telegram_accounts to authenticated;
grant select, insert, update on table public.integration_events to authenticated;
grant select, insert, update on table public.notification_deliveries to authenticated;

drop policy if exists "Administrador gerencia contas Telegram" on public.talent_telegram_accounts;
create policy "Administrador gerencia contas Telegram"
on public.talent_telegram_accounts
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

drop policy if exists "Administrador gerencia eventos de integracao" on public.integration_events;
create policy "Administrador gerencia eventos de integracao"
on public.integration_events
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

drop policy if exists "Administrador gerencia notificacoes" on public.notification_deliveries;
create policy "Administrador gerencia notificacoes"
on public.notification_deliveries
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

comment on table public.talent_telegram_accounts is
  'Vinculos consentidos entre talentos e contas do Telegram.';

comment on table public.integration_events is
  'Fila auditavel e idempotente de eventos entre Casting Attual 360, Telegram e ATTUAL ONE.';

comment on table public.notification_deliveries is
  'Historico e fila de notificacoes multicanal do Casting Attual 360.';
