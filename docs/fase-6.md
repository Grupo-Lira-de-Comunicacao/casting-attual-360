# Fase 6 — Gestão completa e auditoria

## Objetivo

Permitir correções administrativas controladas sem apagar ou reescrever a mensagem original enviada pelo interessado.

## Campos editáveis

- nome;
- e-mail;
- empresa ou identificação;
- tipo;
- status;
- responsável;
- observações internas.

## Campos preservados

- mensagem original;
- identificador;
- data de recebimento;
- marcação de teste.

## Segurança

- atualização restrita a colunas explicitamente autorizadas;
- validação no servidor;
- RLS baseada em `private.is_admin_request_viewer()`;
- histórico inserido apenas por trigger;
- usuários autenticados recebem somente `SELECT` no histórico;
- nenhuma `service_role` é usada no navegador.

## Implantação

O arquivo `docs/fase-6-supabase-plan.sql` é apenas uma proposta versionada. Deve ser revisado e aprovado antes de qualquer execução no Supabase. O PR permanece em rascunho e encadeado à Fase 5.
