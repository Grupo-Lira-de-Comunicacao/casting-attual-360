-- Estende a observabilidade da integracao com backlog, DLQ, percentis e circuit breaker.

create or replace function public.get_integration_metrics(
  p_window_hours integer default 24,
  p_stuck_minutes integer default 15
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with parameters as (
    select
      greatest(1, least(coalesce(p_window_hours, 24), 720))::integer as window_hours,
      greatest(1, least(coalesce(p_stuck_minutes, 15), 1440))::integer as stuck_minutes
  ),
  event_totals as (
    select
      count(*)::bigint as total,
      count(*) filter (where status = 'pendente')::bigint as pendente,
      count(*) filter (where status = 'processando')::bigint as processando,
      count(*) filter (where status = 'processado')::bigint as processado,
      count(*) filter (where status = 'falhou')::bigint as falhou,
      count(*) filter (where status = 'cancelado')::bigint as cancelado,
      coalesce(sum(reprocessamentos), 0)::bigint as reprocessamentos
    from public.integration_events
  ),
  recent_events as (
    select
      count(*)::bigint as total,
      count(*) filter (where status = 'processado')::bigint as processados,
      count(*) filter (where status = 'falhou')::bigint as falhas
    from public.integration_events, parameters
    where criado_em >= now() - make_interval(hours => parameters.window_hours)
  ),
  backlog as (
    select
      count(*)::bigint as total,
      min(criado_em) as oldest_at,
      case
        when min(criado_em) is null then 0
        else floor(extract(epoch from (now() - min(criado_em))))::bigint
      end as oldest_age_seconds
    from public.integration_events
    where status in ('pendente', 'falhou')
  ),
  stuck_events as (
    select count(*)::bigint as total
    from public.integration_events, parameters
    where status = 'processando'
      and atualizado_em < now() - make_interval(mins => parameters.stuck_minutes)
  ),
  attempt_metrics as (
    select
      round(avg(duration_ms) filter (where status = 'processado' and duration_ms is not null))::bigint
        as average_delivery_ms,
      round(avg(duration_ms) filter (where duration_ms is not null))::bigint
        as average_attempt_ms,
      round(percentile_cont(0.50) within group (order by duration_ms)
        filter (where status = 'processado' and duration_ms is not null))::bigint as p50_delivery_ms,
      round(percentile_cont(0.95) within group (order by duration_ms)
        filter (where status = 'processado' and duration_ms is not null))::bigint as p95_delivery_ms,
      round(percentile_cont(0.99) within group (order by duration_ms)
        filter (where status = 'processado' and duration_ms is not null))::bigint as p99_delivery_ms,
      count(*) filter (where status = 'interrompido')::bigint as interrupted_attempts,
      count(*) filter (where http_status in (401, 403))::bigint as auth_failures,
      count(*) filter (where http_status = 429)::bigint as rate_limited_attempts,
      count(*) filter (where http_status between 500 and 599)::bigint as server_failures
    from public.integration_event_attempts, parameters
    where started_at >= now() - make_interval(hours => parameters.window_hours)
  ),
  dead_letters as (
    select
      count(*) filter (where state = 'dead_letter')::bigint as active,
      count(*) filter (where state = 'reprocessed')::bigint as reprocessed
    from public.integration_event_dead_letters
  ),
  circuit as (
    select coalesce(
      (
        select jsonb_build_object(
          'state', state,
          'consecutive_failures', consecutive_failures,
          'opened_at', opened_at,
          'retry_after_at', retry_after_at,
          'last_failure_at', last_failure_at,
          'last_success_at', last_success_at
        )
        from public.integration_circuit_breakers
        where target_system = 'attual-one'
      ),
      jsonb_build_object(
        'state', 'closed',
        'consecutive_failures', 0,
        'opened_at', null,
        'retry_after_at', null,
        'last_failure_at', null,
        'last_success_at', null
      )
    ) as item
  ),
  top_event_types as (
    select coalesce(jsonb_agg(to_jsonb(grouped) order by grouped.total desc, grouped.event_type), '[]'::jsonb) as items
    from (
      select event_type, count(*)::bigint as total
      from public.integration_events, parameters
      where criado_em >= now() - make_interval(hours => parameters.window_hours)
      group by event_type
      order by total desc, event_type
      limit 10
    ) grouped
  ),
  recent_failures as (
    select coalesce(jsonb_agg(to_jsonb(failures) order by failures.criado_em desc), '[]'::jsonb) as items
    from (
      select id, event_key, event_type, target_system, tentativas, ultimo_erro, criado_em, atualizado_em
      from public.integration_events
      where status = 'falhou'
      order by atualizado_em desc
      limit 10
    ) failures
  )
  select jsonb_build_object(
    'generated_at', now(),
    'window_hours', parameters.window_hours,
    'stuck_minutes', parameters.stuck_minutes,
    'totals', jsonb_build_object(
      'all', event_totals.total,
      'pending', event_totals.pendente,
      'processing', event_totals.processando,
      'processed', event_totals.processado,
      'failed', event_totals.falhou,
      'cancelled', event_totals.cancelado,
      'reprocessings', event_totals.reprocessamentos,
      'dead_letters', dead_letters.active,
      'dead_letters_reprocessed', dead_letters.reprocessed
    ),
    'window', jsonb_build_object(
      'events', recent_events.total,
      'processed', recent_events.processados,
      'failed', recent_events.falhas,
      'success_rate', case
        when (recent_events.processados + recent_events.falhas) = 0 then null
        else round(
          recent_events.processados::numeric * 100 /
          (recent_events.processados + recent_events.falhas),
          2
        )
      end
    ),
    'backlog', jsonb_build_object(
      'events', backlog.total,
      'oldest_at', backlog.oldest_at,
      'oldest_age_seconds', backlog.oldest_age_seconds,
      'sla_seconds', 60,
      'within_sla', backlog.oldest_age_seconds <= 60
    ),
    'performance', jsonb_build_object(
      'average_delivery_ms', attempt_metrics.average_delivery_ms,
      'average_attempt_ms', attempt_metrics.average_attempt_ms,
      'p50_delivery_ms', attempt_metrics.p50_delivery_ms,
      'p95_delivery_ms', attempt_metrics.p95_delivery_ms,
      'p99_delivery_ms', attempt_metrics.p99_delivery_ms,
      'interrupted_attempts', attempt_metrics.interrupted_attempts,
      'stuck_events', stuck_events.total
    ),
    'http', jsonb_build_object(
      'auth_failures_401_403', attempt_metrics.auth_failures,
      'rate_limited_429', attempt_metrics.rate_limited_attempts,
      'server_failures_5xx', attempt_metrics.server_failures
    ),
    'circuit', circuit.item,
    'top_event_types', top_event_types.items,
    'recent_failures', recent_failures.items
  )
  from parameters, event_totals, recent_events, backlog, stuck_events,
       attempt_metrics, dead_letters, circuit, top_event_types, recent_failures;
$$;

revoke all on function public.get_integration_metrics(integer, integer) from public, anon, authenticated;
grant execute on function public.get_integration_metrics(integer, integer) to service_role;

comment on function public.get_integration_metrics(integer, integer) is
  'Consolida indicadores operacionais, SLA, backlog, DLQ, circuit breaker e percentis da integracao.';
