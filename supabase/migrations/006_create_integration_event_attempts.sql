-- Histórico imutável de cada tentativa de entrega de eventos de integração.

create table if not exists public.integration_event_attempts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.integration_events(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'processando'
    check (status in ('processando', 'processado', 'falhou', 'interrompido')),
  http_status integer check (http_status is null or (http_status between 100 and 599)),
  error_message text,
  response_payload jsonb,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_event_attempts_event_id_idx
  on public.integration_event_attempts(event_id, created_at desc);

create index if not exists integration_event_attempts_status_idx
  on public.integration_event_attempts(status, started_at desc);

create or replace function public.set_integration_event_attempt_updated_at()
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

drop trigger if exists set_integration_event_attempts_updated_at
  on public.integration_event_attempts;

create trigger set_integration_event_attempts_updated_at
before update on public.integration_event_attempts
for each row execute function public.set_integration_event_attempt_updated_at();

alter table public.integration_event_attempts enable row level security;

revoke all on table public.integration_event_attempts from anon, authenticated;
grant all on table public.integration_event_attempts to service_role;

comment on table public.integration_event_attempts is
  'Registro técnico e imutável das tentativas de entrega dos eventos de integração.';
comment on column public.integration_event_attempts.attempt_number is
  'Número da tentativa dentro do ciclo técnico atual; pode reiniciar após reprocessamento manual.';
comment on column public.integration_event_attempts.response_payload is
  'Resposta resumida do destino, limitada pela aplicação para evitar dados excessivos.';
