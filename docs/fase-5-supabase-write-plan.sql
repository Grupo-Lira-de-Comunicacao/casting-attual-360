-- Fase 5 — política administrativa de atualização de status
-- Aplicada manualmente no Supabase após aprovação.
-- O acesso de UPDATE permanece restrito à coluna status e aos administradores autorizados.

begin;

-- Remove qualquer permissão ampla de atualização.
revoke update on table public.requests from authenticated;

-- Permite alterar somente a coluna status.
grant update (status) on table public.requests to authenticated;

-- Restringe a operação aos administradores reconhecidos pela função privada existente.
drop policy if exists
  "Admins autorizados podem atualizar solicitacoes"
on public.requests;

create policy "Admins autorizados podem atualizar solicitacoes"
on public.requests
for update
to authenticated
using ((select private.is_admin_request_viewer()))
with check ((select private.is_admin_request_viewer()));

commit;

-- Evoluções futuras, ainda não aplicadas:
-- - adicionar assigned_to, internal_notes e updated_at;
-- - criar tabela de histórico administrativo;
-- - registrar mudanças de status e responsável por trigger ou função segura.
