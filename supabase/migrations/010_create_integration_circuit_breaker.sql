-- Circuit breaker persistente para destinos de integracao.
-- Politica inicial: 5 falhas transitórias consecutivas, 60s aberto, 1 probe half-open.

create table if not exists public.integration_circuit_breakers (
  target_system text primary key,
  state text not null default 'closed' check (state in ('closed', 'open', 'half_open')),
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  opened_at timestamptz,
  retry_after_at timestamptz,
  half_open_probes integer not null default 0 check (half_open_probes >= 0),
  last_failure_at timestamptz,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

create or replace function public.integration_circuit_allow(p_target_system text)
returns table(allowed boolean, circuit_state text, retry_after_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.integration_circuit_breakers;
begin
  insert into public.integration_circuit_breakers(target_system)
  values (p_target_system)
  on conflict (target_system) do nothing;

  select * into v_row
  from public.integration_circuit_breakers
  where target_system = p_target_system
  for update;

  if v_row.state = 'open' then
    if v_row.retry_after_at is not null and v_row.retry_after_at > now() then
      return query select false, 'open'::text, v_row.retry_after_at;
      return;
    end if;

    update public.integration_circuit_breakers
    set
      state = 'half_open',
      half_open_probes = 1,
      updated_at = now()
    where target_system = p_target_system;

    return query select true, 'half_open'::text, null::timestamptz;
    return;
  end if;

  if v_row.state = 'half_open' then
    return query select false, 'half_open'::text, v_row.retry_after_at;
    return;
  end if;

  return query select true, 'closed'::text, null::timestamptz;
end;
$$;

create or replace function public.integration_circuit_record_success(p_target_system text)
returns public.integration_circuit_breakers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.integration_circuit_breakers;
begin
  insert into public.integration_circuit_breakers(
    target_system, state, consecutive_failures, opened_at, retry_after_at,
    half_open_probes, last_success_at, updated_at
  ) values (
    p_target_system, 'closed', 0, null, null, 0, now(), now()
  )
  on conflict (target_system) do update set
    state = 'closed',
    consecutive_failures = 0,
    opened_at = null,
    retry_after_at = null,
    half_open_probes = 0,
    last_success_at = now(),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.integration_circuit_record_failure(p_target_system text)
returns public.integration_circuit_breakers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.integration_circuit_breakers;
  v_failures integer;
begin
  insert into public.integration_circuit_breakers(target_system)
  values (p_target_system)
  on conflict (target_system) do nothing;

  select * into v_row
  from public.integration_circuit_breakers
  where target_system = p_target_system
  for update;

  v_failures := v_row.consecutive_failures + 1;

  if v_row.state = 'half_open' or v_failures >= 5 then
    update public.integration_circuit_breakers
    set
      state = 'open',
      consecutive_failures = v_failures,
      opened_at = now(),
      retry_after_at = now() + interval '60 seconds',
      half_open_probes = 0,
      last_failure_at = now(),
      updated_at = now()
    where target_system = p_target_system
    returning * into v_row;
  else
    update public.integration_circuit_breakers
    set
      consecutive_failures = v_failures,
      last_failure_at = now(),
      updated_at = now()
    where target_system = p_target_system
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

alter table public.integration_circuit_breakers enable row level security;
revoke all on table public.integration_circuit_breakers from anon, authenticated;
grant all on table public.integration_circuit_breakers to service_role;

revoke all on function public.integration_circuit_allow(text) from public, anon, authenticated;
grant execute on function public.integration_circuit_allow(text) to service_role;
revoke all on function public.integration_circuit_record_success(text) from public, anon, authenticated;
grant execute on function public.integration_circuit_record_success(text) to service_role;
revoke all on function public.integration_circuit_record_failure(text) from public, anon, authenticated;
grant execute on function public.integration_circuit_record_failure(text) to service_role;

comment on table public.integration_circuit_breakers is
  'Estado persistente do circuit breaker por sistema de destino.';
