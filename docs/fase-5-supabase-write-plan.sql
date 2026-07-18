-- Fase 5 — proposta de evolução administrativa (NÃO APLICADA AUTOMATICAMENTE)
-- Este arquivo documenta a mudança necessária no Supabase para permitir
-- atualização de status e, futuramente, observações e histórico.
-- Deve ser revisado e aprovado antes de execução no projeto Supabase.

-- 1. Permitir UPDATE apenas a usuários autenticados.
grant update on table public.requests to authenticated;

-- 2. Restringir UPDATE aos administradores autorizados pela função privada já existente.
create policy "Admins autorizados podem atualizar solicitacoes"
on public.requests
for update
to authenticated
using ((select private.is_admin_request_viewer()))
with check ((select private.is_admin_request_viewer()));

-- Próxima evolução sugerida, também sujeita a aprovação:
-- - adicionar assigned_to, internal_notes e updated_at;
-- - criar tabela de histórico administrativo;
-- - registrar mudanças de status e responsável por trigger ou função segura.
