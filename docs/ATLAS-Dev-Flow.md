ATLAS Dev Flow — Casting Attual 360

Autoridade e Branch Autorizada
- Sérgio Lira é a única autoridade para aprovar commits e pushes.
- Repositório: SPLIRA/casting-attual-360
- Branch autorizada para escrita automatizada (codex): codex/fase-9-arquitetura-cadastros-reais

Ações Disponíveis
- read_only_repo_inventory: consulta de inventário de branches e commits.
- read_only_repo_structure: listagem de estrutura e arquivos do repositório.
- prepare_controlled_write: preparação de alterações somente em README.md e arquivos dentro de docs/, com geração de diff e de um approval_id; mantém uma solicitação pendente (sem commit e sem push nesta etapa).

Capacidades Atuais
- O sistema já consegue:
  - Preparar alterações em README.md e em arquivos dentro de docs/ via prepare_controlled_write.
  - Gerar um approval_id para cada solicitação preparada.
  - Após aprovação explícita de Sérgio vinculada ao approval_id, realizar commit e push exclusivamente na branch codex autorizada (codex/fase-9-arquitetura-cadastros-reais). Nenhum merge é realizado.
- Alterações em src/ continuam condicionadas à passagem de lint, typecheck e build antes de qualquer commit e push.

Status Operacional Atual do Runner
- O Codex Runner encontra-se em modo seguro, com execução de código desativada. Portanto, após a aprovação de uma solicitação, a etapa de commit e push ficará pendente até que o Runner seja habilitado. Não são afirmadas nem realizadas execuções de testes, varreduras, relatórios, commits, artefatos ou quaisquer alterações enquanto o modo seguro estiver ativo.

Restrições e Proibições (Totais)
- Proibido modificar main ou master.
- Proibido realizar merge.
- Proibido executar SQL ou interagir com banco de dados.
- Proibido publicar em produção.
- Proibido alterar domínio, DNS, custos ou credenciais (.env, chaves, segredos).
- Proibido escrever fora de README.md e docs/ nesta fase.
- Proibido excluir arquivos ou dados.
- Proibido alterar pastas sensíveis como supabase/.

Fluxo Operacional Padrão
1) Solicitação: Sérgio descreve o que deve ser criado/alterado em README.md ou docs/.
2) Preparação: o sistema executa prepare_controlled_write para gerar alterações em cópia temporária, produzir o diff e retornar um approval_id. Não há commit nem push nesta etapa.
3) Retorno: o approval_id é devolvido a Sérgio para revisão.
4) Aprovação: Sérgio aprova explicitamente informando o approval_id correspondente.
5) Commit e Push: após a aprovação, o fluxo prevê commit e push somente na branch autorizada (codex/fase-9-arquitetura-cadastros-reais). A execução dessa etapa depende do estado do Runner. Não são realizados merges.

Padrões de Resposta do ATLAS
- As respostas operacionais são fornecidas exclusivamente em JSON válido.
- Na preparação (prepare_controlled_write), a solicitação não exige aprovação imediata: trata-se apenas da criação do diff com retorno do approval_id para revisão humana.
- Em caso de risco, ambiguidade ou qualquer pedido proibido (main, master, merge, SQL, produção, domínios/DNS, custos, credenciais, exclusões, escrita fora de README.md e docs/), a solicitação deve ser bloqueada.

Escopo Atual de Escrita
- Permitido: README.md e docs/.
- Demais caminhos permanecem bloqueados nesta fase.
