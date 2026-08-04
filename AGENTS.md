# AGENTS — CASTING ATTUAL 360

Use como referência de governança o repositório `Grupo-Lira-de-Comunicacao/atlas-core`, especialmente `ATLAS_CORE_RULES.md` e `AGENTS.md`.

## Projeto
Este repositório contém o Casting Attual 360, incluindo fluxos de Produções, Convocações, Matching, Shortlist, convites e integrações com ATTUAL ONE.

## Diretrizes locais
- Preserve os contratos de integração já documentados com ATTUAL ONE.
- Respeite a máquina de estados dos convites e evite regressão de estado.
- Mantenha idempotência, auditoria, autenticação e observabilidade nos fluxos de integração.
- Mudanças em eventos, payloads ou estados devem considerar consumidores existentes.
- Não introduza disparos automáticos de comunicação sem respeitar as regras de seleção e aprovação já definidas no projeto.
- Nunca exponha segredos, tokens ou credenciais.
- Execute testes e validações disponíveis antes de concluir alterações.
