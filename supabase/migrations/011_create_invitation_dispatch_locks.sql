-- Serializacao e ordenacao por invitation_id para o dispatcher de integracao.
-- Um convite so pode ter um evento ativo por vez, sempre respeitando o mais antigo ainda pendente.

create table if not exists public.integration_invitation_dispatch_locks (
  invitation_id text primary key,
  event_id uuid not null references public.integration_events(id) on delete cascade,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists integration_events_invitation_order_idx
  on public.integration_events ((payload ->> 'invitation_id'), criado_em)
  where status in ('pendente', 'falhou', 'processando');

create or replace function public.try_lock_integration_invitation(
  p_invitation_id text,
  p_event_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created_at timestamptz;
  v_locked_event uuid;
begin
  if p_invitation_id is null or btrim(p_invitation_id) = '' then
    return true;
  end if;

  select criado_em into v_created_at
  from public.integration_events
  where id = p_event_id;

  if v_created_at is null then
    return false;
  end if;

  if exists (
    select 1
    from public.integration_events older
    where older.id <> p_event_id
      and older.payload ->> 'invitation_id' = p_invitation_id
      and older.status in ('pendente', 'falhou', 'processando')
      and older.criado_em < v_created_at
  ) then
    return false;
  end if;

  insert into public.integration_invitation_dispatch_locks (
    invitation_id, event_id, locked_at, expires_at, updated_at
  ) values (
    p_invitation_id, p_event_id, now(), now() + interval '16 minutes', now()
  )
  on conflict (invitation_id) do update set
    event_id = excluded.event_id,
    locked_at = excluded.locked_at,
    expires_at = excluded.expires_at,
    updated_at = now()
  where public.integration_invitation_dispatch_locks.expires_at <= now()
     or public.integration_invitation_dispatch_locks.event_id = excluded.event_id
  returning event_id into v_locked_event;

  return v_locked_event = p_event_id;
end;
$$;

create or replace function public.unlock_integration_invitation(
  p_invitation_id text,
  p_event_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if p_invitation_id is null or btrim(p_invitation_id) = '' then
    return true;
  end if;

  delete from public.integration_invitation_dispatch_locks
  where invitation_id = p_invitation_id
    and event_id = p_event_id;

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

create or replace function public.enforce_integration_invitation_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation_id text;
  v_locked boolean;
begin
  if new.status <> 'processando' or old.status = 'processando' then
    return new;
  end if;

  v_invitation_id := nullif(new.payload ->> 'invitation_id', '');
  if v_invitation_id is null then
    return new;
  end if;

  v_locked := public.try_lock_integration_invitation(v_invitation_id, new.id);
  if not v_locked then
    raise exception 'Convite % possui evento anterior ativo ou processamento concorrente.', v_invitation_id;
  end if;

  return new;
end;
$$;

create or replace function public.release_integration_invitation_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation_id text;
begin
  if old.status <> 'processando' or new.status = 'processando' then
    return new;
  end if;

  v_invitation_id := nullif(old.payload ->> 'invitation_id', '');
  perform public.unlock_integration_invitation(v_invitation_id, old.id);
  return new;
end;
$$;

drop trigger if exists integration_events_enforce_invitation_order
  on public.integration_events;
create trigger integration_events_enforce_invitation_order
before update of status on public.integration_events
for each row execute function public.enforce_integration_invitation_order();

drop trigger if exists integration_events_release_invitation_order
  on public.integration_events;
create trigger integration_events_release_invitation_order
after update of status on public.integration_events
for each row execute function public.release_integration_invitation_order();

alter table public.integration_invitation_dispatch_locks enable row level security;
revoke all on table public.integration_invitation_dispatch_locks from anon, authenticated;
grant all on table public.integration_invitation_dispatch_locks to service_role;

revoke all on function public.try_lock_integration_invitation(text, uuid) from public, anon, authenticated;
grant execute on function public.try_lock_integration_invitation(text, uuid) to service_role;
revoke all on function public.unlock_integration_invitation(text, uuid) from public, anon, authenticated;
grant execute on function public.unlock_integration_invitation(text, uuid) to service_role;

comment on table public.integration_invitation_dispatch_locks is
  'Lock efemero que impede dois workers de processarem simultaneamente eventos do mesmo convite.';
comment on function public.try_lock_integration_invitation(text, uuid) is
  'Adquire lock apenas para o evento mais antigo ainda ativo do invitation_id informado.';
comment on function public.enforce_integration_invitation_order() is
  'Impede a transicao para processando quando existe evento anterior ativo ou lock concorrente do convite.';
