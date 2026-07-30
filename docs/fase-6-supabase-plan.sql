-- Fase 6 — gestão completa e auditoria administrativa
-- PROPOSTA VERSIONADA. NÃO EXECUTAR SEM APROVAÇÃO EXPLÍCITA.

begin;

alter table public.requests
  add column if not exists assigned_to text not null default '',
  add column if not exists internal_notes text not null default '',
  add column if not exists updated_at timestamp with time zone not null default now();

create table if not exists public.request_admin_history (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.requests(id) on delete restrict,
  changed_at timestamp with time zone not null default now(),
  changed_by uuid,
  changed_by_email text,
  changes jsonb not null check (jsonb_typeof(changes) = 'object')
);

create index if not exists request_admin_history_request_changed_idx
  on public.request_admin_history (request_id, changed_at desc);

alter table public.request_admin_history enable row level security;

revoke all on table public.request_admin_history from anon, authenticated;
grant select on table public.request_admin_history to authenticated;

drop policy if exists "Admins autorizados podem consultar historico" on public.request_admin_history;
create policy "Admins autorizados podem consultar historico"
on public.request_admin_history
for select
to authenticated
using ((select private.is_admin_request_viewer()));

create or replace function private.set_request_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

create or replace function private.audit_request_admin_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  change_set jsonb;
begin
  change_set := jsonb_strip_nulls(jsonb_build_object(
    'name', case when old.name is distinct from new.name then jsonb_build_object('from', old.name, 'to', new.name) end,
    'email', case when old.email is distinct from new.email then jsonb_build_object('from', old.email, 'to', new.email) end,
    'organization', case when old.organization is distinct from new.organization then jsonb_build_object('from', old.organization, 'to', new.organization) end,
    'request_type', case when old.request_type is distinct from new.request_type then jsonb_build_object('from', old.request_type, 'to', new.request_type) end,
    'status', case when old.status is distinct from new.status then jsonb_build_object('from', old.status, 'to', new.status) end,
    'assigned_to', case when old.assigned_to is distinct from new.assigned_to then jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to) end,
    'internal_notes', case when old.internal_notes is distinct from new.internal_notes then jsonb_build_object('from', old.internal_notes, 'to', new.internal_notes) end
  ));

  if change_set <> '{}'::jsonb then
    insert into public.request_admin_history (request_id, changed_by, changed_by_email, changes)
    values (new.id, auth.uid(), auth.jwt() ->> 'email', change_set);
  end if;

  return new;
end;
$function$;

revoke all on function private.set_request_updated_at() from public, anon, authenticated;
revoke all on function private.audit_request_admin_update() from public, anon, authenticated;

drop trigger if exists set_requests_updated_at on public.requests;
create trigger set_requests_updated_at
before update of name, email, organization, request_type, status, assigned_to, internal_notes
on public.requests
for each row execute function private.set_request_updated_at();

drop trigger if exists audit_requests_admin_update on public.requests;
create trigger audit_requests_admin_update
after update of name, email, organization, request_type, status, assigned_to, internal_notes
on public.requests
for each row execute function private.audit_request_admin_update();

revoke update on table public.requests from authenticated;
grant update (name, email, organization, request_type, status, assigned_to, internal_notes)
  on table public.requests to authenticated;

drop policy if exists "Admins autorizados podem atualizar solicitacoes" on public.requests;
create policy "Admins autorizados podem atualizar solicitacoes"
on public.requests
for update
to authenticated
using ((select private.is_admin_request_viewer()))
with check ((select private.is_admin_request_viewer()));

commit;

-- Verificações manuais após aprovação e execução:
-- 1. administrador autorizado edita um registro marcado como teste;
-- 2. mensagem original permanece inalterada;
-- 3. public.request_admin_history recebe somente os campos efetivamente alterados;
-- 4. usuário autenticado não autorizado não lê nem altera solicitações ou histórico;
-- 5. anon não lê nem altera solicitações ou histórico.
