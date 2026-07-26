Plano de Correção – Fluxo Telegram (n8n)

Resumo
- Objetivo: 
  1) Exibir nomes das ações como texto puro (sem Markdown) nas mensagens do Telegram.
  2) Remover o rodapé automático adicionado pelo n8n nas mensagens do Telegram.
- Escopo: Ajustes em nós/fluxos do n8n relacionados ao envio de mensagens no Telegram.
- Não-escopo: alterações em src/, banco de dados/SQL, pipelines, domínio/DNS, custos ou produção nesta etapa.
- Estado: Plano documentado, sem execução. Depende de approval_id e aprovação de Sérgio Lira para prosseguir com implementação.

Contexto
- Há mensagens no Telegram com nomes de ações apresentando formatação Markdown indesejada (ex.: negrito/itálico por caracteres especiais) e um rodapé automático oriundo da configuração atual do n8n.

Itens de correção
1) Remover formatação Markdown dos nomes das ações
- Ações propostas no n8n (em cada nó que envia ao Telegram, p.ex. Telegram > Send Message):
  - Definir Parse Mode como "None" (ou deixar em branco) em Additional Fields/Parse Mode, evitando interpretação de Markdown/HTML.
  - Sanitizar/normalizar o texto do nome da ação para remover/escapar caracteres reservados do Markdown antes de compor a mensagem.
    - Caracteres comuns a tratar: * _ [ ] ( ) ~ ` > # + - = | { } . !
    - Estratégias:
      - Preferencial: remover ou escapar esses caracteres no momento da construção da string (via Set/Function nodes) antes do Telegram Send Message.
      - Alternativa: se o nome da ação vem de integração externa, aplicar uma etapa intermediária (Set/Function) para produzir um campo action_name_plain.
    - Exemplo (Function Node) – remover formatação:
      // Nota: este snippet é ilustrativo para ser colado em um nó Function do n8n.
      // Não é execução automática neste repositório.
      const s = $json.action_name || "";
      const sanitized = s.replace(/[\\*_[\]()`~>#+\-=|{}.!]/g, "");
      return { json: { ...$json, action_name_plain: sanitized } };
    - Compor a mensagem usando {{ $json.action_name_plain }} ou equivalente, garantindo ausência de asteriscos/underscores.

2) Remover rodapé automático do n8n
- Revisar os nós que compõem a mensagem final e identificar onde o rodapé é anexado.
  - Se houver campo/variável concatenada (ex.: footer, signature, executionUrl, via n8n), remover do template.
  - Em nós que suportam opções de inclusão de metadados/links (ex.: Respond to Webhook, ou integrações que adicionem URL de execução), desativar opções como "Include execution URL / Append footer" quando aplicável.
  - Remover linhas estáticas do template do tipo "— via n8n" ou similares.
- Caso o rodapé seja injetado por um nó central (ex.: um Set ou Function que sempre concatena assinatura), aplicar a remoção nesse ponto único.
- Garantir que não restem expressões no corpo da mensagem que insiram sufixos acidentais (p.ex.: {{$json.footer}} ou {{$workflow.executionUrl}}).

Critérios de aceitação
- Mensagens do Telegram:
  - Não apresentam negrito/itálico/links oriundos de interpretação de Markdown nos nomes das ações.
  - Não exibem qualquer rodapé automático (links de execução, assinaturas ou menções ao n8n).
- Campos e templates revisados permanecem consistentes com o restante do fluxo.

Validação (ambiente controlado, sem produção)
- Executar testes em ambiente de desenvolvimento/sandbox do n8n ou com o bot de testes.
- Verificar uma amostra de n mensagens que contenham diferentes nomes de ações (incluindo caracteres potencialmente problemáticos) e confirmar exibição plana.
- Confirmar que nenhum rodapé adicional aparece.

Riscos e rollback
- Risco baixo: alterações limitadas a formatação de mensagens.
- Rollback: restaurar a versão anterior do workflow no n8n (versionamento interno do n8n) caso seja necessário.

Responsáveis e aprovação
- Aprovação necessária: Sérgio Lira.
- Execução condicionada ao retorno do approval_id pelo Runner e posterior aprovação explícita de Sérgio.
- Nenhum commit/push será feito antes da aprovação.

Observações de conformidade
- Esta etapa não altera main/master, não faz merge, não altera src/, não executa SQL, não publica em produção, não altera domínio/DNS/custos/credenciais e não exclui arquivos ou dados.
