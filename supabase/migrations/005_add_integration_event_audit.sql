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

create or replace function public.retry_integration_event(
  p_event_id uuid,
  p_admin_user_id uuid
)
returns public.integration_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.integration_events;
begin
  update public.integration_events
  set
    status = 'pendente',
    tentativas = 0,
    ultimo_erro = null,
    processado_em = null,
    reprocessamentos = reprocessamentos + 1,
    ultimo_reprocessamento_em = now(),
    ultimo_reprocessamento_por = p_admin_user_id
  where id = p_event_id
    and status in ('falhou', 'cancelado')
    and reprocessamentos < 100
  returning * into v_event;

  if v_event.id is null then
    raise exception 'Evento inexistente ou não elegível para reprocessamento.';
  end if;

  return v_event;
end;
$$;

revoke all on function public.retry_integration_event(uuid, uuid) from public, anon, authenticated;
grant execute on function public.retry_integration_event(uuid, uuid) to service_role;

comment on column public.integration_events.reprocessamentos is
  'Quantidade de reprocessamentos manuais solicitados por administradores.';

comment on column public.integration_events.ultimo_reprocessamento_em is
  'Data e hora da solicitacao administrativa mais recente de reprocessamento.';

comment on column public.integration_events.ultimo_reprocessamento_por is
  'Administrador que solicitou o reprocessamento mais recente.';

comment on function public.retry_integration_event(uuid, uuid) is
  'Reposiciona atomicamente um evento falho ou cancelado na fila e registra a auditoria administrativa.';
