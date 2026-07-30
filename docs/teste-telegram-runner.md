Teste Telegram Runner

Este arquivo valida a preparação controlada pelo fluxo Atlas (Codex Runner) para o repositório Casting Attual 360.

Escopo:
- Ação proposta: inclusão deste arquivo de documentação via preparação controlada (sem commit e sem push).
- O Codex Runner está em modo seguro, com execução de código desativada; portanto, esta etapa apenas prepara o diff.
- Nenhuma verificação, teste, varredura, relatório, artefato, commit, push ou alteração permanente será executada nesta fase.
- Não há alterações em main ou master; não é realizado merge; não há SQL, publicação em produção, alterações de domínio/DNS, custos ou credenciais; nenhum arquivo ou dado é apagado.

Governança:
- Sérgio Lira é a única autoridade para aprovar commits e pushes.

Próximos passos condicionais:
- Após o Runner retornar um approval_id, poderá ser solicitada a aprovação do Sérgio Lira para decidir sobre a continuidade do fluxo.
- Qualquer execução adicional depende da habilitação futura do Runner e da aprovação explícita.

Referência:
- Fluxo Atlas: preparação controlada restrita a README.md e docs/ nesta fase.