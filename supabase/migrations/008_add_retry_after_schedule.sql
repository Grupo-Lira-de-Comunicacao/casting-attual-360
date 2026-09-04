alter table public.integration_events
  add column if not exists proxima_tentativa_em timestamptz;

create index if not exists integration_events_retry_schedule_idx
  on public.integration_events (status, proxima_tentativa_em, criado_em)
  where status in ('pendente', 'falhou');

comment on column public.integration_events.proxima_tentativa_em is
  'Horario minimo para nova tentativa quando o destino solicita Retry-After; nulo usa apenas a politica normal de backoff.';
