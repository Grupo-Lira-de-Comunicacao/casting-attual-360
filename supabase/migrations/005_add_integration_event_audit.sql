-- Casting Attual 360
-- Auditoria de reprocessamento manual dos eventos de integracao.
-- Execute depois de 003_create_integrations.sql.

alter table public.integration_events
  add column if not exists reprocessamentos integer not null default 0,
  add column if not exists ultimo_reprocessamento_em timestamptz,
  add column if not exists ultimo_reprocessamento_por uuid references auth.users(id) on delete set null;

alter table public.integration_events
  drop constraint if exists integration_events_reprocessamentos_range;

alter table public.integration_events
  add constraint integration_events_reprocessamentos_range
  check (reprocessamentos between 0 and 100);

create index if not exists integration_events_audit_idx
  on public.integration_events (ultimo_reprocessamento_em desc)
  where ultimo_reprocessamento_em is not null;

comment on column public.integration_events.reprocessamentos is
  'Quantidade de reprocessamentos manuais solicitados por administradores.';

comment on column public.integration_events.ultimo_reprocessamento_em is
  'Data e hora da solicitacao administrativa mais recente de reprocessamento.';

comment on column public.integration_events.ultimo_reprocessamento_por is
  'Administrador que solicitou o reprocessamento mais recente.';
