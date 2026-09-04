-- Dead-letter formal para eventos de integracao que falharam de forma terminal.
-- Migration aditiva: preserva integration_events e o historico de tentativas.

create table if not exists public.integration_event_dead_letters (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.integration_events(id) on delete cascade,
  event_key uuid not null,
  invitation_id text,
  event_type text not null,
  payload_hash text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  first_error text,
  last_error text,
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  last_http_status integer check (last_http_status is null or last_http_status between 100 and 599),
  correlation_id text not null,
  reason text not null,
  state text not null default 'dead_letter' check (state in ('dead_letter', 'reprocessed')),
  reprocess_count integer not null default 0 check (reprocess_count between 0 and 100),
  last_reprocessed_at timestamptz,
  last_reprocessed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_event_dead_letters_state_idx
  on public.integration_event_dead_letters (state, created_at desc);

create index if not exists integration_event_dead_letters_invitation_idx
  on public.integration_event_dead_letters (invitation_id, created_at desc)
  where invitation_id is not null;

create or replace function public.set_integration_dead_letter_updated_at()
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

drop trigger if exists set_integration_event_dead_letters_updated_at
  on public.integration_event_dead_letters;
create trigger set_integration_event_dead_letters_updated_at
before update on public.integration_event_dead_letters
for each row execute function public.set_integration_dead_letter_updated_at();

create or replace function public.dead_letter_integration_event(
  p_event_id uuid,
  p_payload_hash text,
  p_reason text
)
returns public.integration_event_dead_letters
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.integration_events;
  v_first_attempt public.integration_event_attempts;
  v_last_attempt public.integration_event_attempts;
  v_dead_letter public.integration_event_dead_letters;
begin
  select * into v_event
  from public.integration_events
  where id = p_event_id
  for update;

  if v_event.id is null then
    raise exception 'Evento de integracao inexistente.';
  end if;

  select * into v_first_attempt
  from public.integration_event_attempts
  where event_id = p_event_id
  order by started_at asc, created_at asc
  limit 1;

  select * into v_last_attempt
  from public.integration_event_attempts
  where event_id = p_event_id
  order by started_at desc, created_at desc
  limit 1;

  update public.integration_events
  set
    status = 'cancelado',
    proxima_tentativa_em = null
  where id = p_event_id;

  insert into public.integration_event_dead_letters (
    event_id,
    event_key,
    invitation_id,
    event_type,
    payload_hash,
    attempt_count,
    first_error,
    last_error,
    first_attempt_at,
    last_attempt_at,
    last_http_status,
    correlation_id,
    reason,
    state
  ) values (
    v_event.id,
    v_event.event_key,
    nullif(v_event.payload ->> 'invitation_id', ''),
    v_event.event_type,
    p_payload_hash,
    v_event.tentativas,
    v_first_attempt.error_message,
    coalesce(v_last_attempt.error_message, v_event.ultimo_erro),
    v_first_attempt.started_at,
    v_last_attempt.started_at,
    v_last_attempt.http_status,
    v_event.event_key::text,
    p_reason,
    'dead_letter'
  )
  on conflict (event_id) do update set
    payload_hash = excluded.payload_hash,
    attempt_count = excluded.attempt_count,
    last_error = excluded.last_error,
    last_attempt_at = excluded.last_attempt_at,
    last_http_status = excluded.last_http_status,
    reason = excluded.reason,
    state = 'dead_letter'
  returning * into v_dead_letter;

  return v_dead_letter;
end;
$$;

-- Mantem o mesmo event_key no reprocessamento e registra o ator no DLQ.
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
    proxima_tentativa_em = null,
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

  update public.integration_event_dead_letters
  set
    state = 'reprocessed',
    reprocess_count = reprocess_count + 1,
    last_reprocessed_at = now(),
    last_reprocessed_by = p_admin_user_id
  where event_id = p_event_id;

  return v_event;
end;
$$;

alter table public.integration_event_dead_letters enable row level security;
revoke all on table public.integration_event_dead_letters from anon, authenticated;
grant all on table public.integration_event_dead_letters to service_role;

revoke all on function public.dead_letter_integration_event(uuid, text, text) from public, anon, authenticated;
grant execute on function public.dead_letter_integration_event(uuid, text, text) to service_role;
revoke all on function public.retry_integration_event(uuid, uuid) from public, anon, authenticated;
grant execute on function public.retry_integration_event(uuid, uuid) to service_role;

comment on table public.integration_event_dead_letters is
  'Dead-letter formal e auditavel dos eventos de integracao que sairam da fila ativa por falha terminal.';
comment on function public.dead_letter_integration_event(uuid, text, text) is
  'Move logicamente um evento para dead-letter e registra evidencias de forma atomica.';
