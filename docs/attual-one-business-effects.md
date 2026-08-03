# Missão 11 — efeitos de negócio no ATTUAL ONE

## Objetivo

Definir de forma determinística o que o ATTUAL ONE deve fazer ao receber cada evento produzido pelo Casting Attual 360. Este documento complementa o contrato do receptor e evita que o endpoint aceite eventos corretamente, mas aplique efeitos de negócio ambíguos.

## Princípios

1. O `event_key` é a chave idempotente da integração.
2. O evento recebido deve ser persistido na `integration_inbox` antes de qualquer efeito interno.
3. Processar novamente o mesmo `event_key` não pode repetir o efeito de negócio.
4. O ATTUAL ONE não altera o estado de origem do Casting; ele mantém uma projeção operacional própria.
5. O Telegram não chama o ATTUAL ONE diretamente. O caminho permanece Casting 360 → `integration_events` → dispatcher → ATTUAL ONE.
6. Toda transição deve registrar `received_at`, `processed_at`, status, tentativas e erro, quando houver.

## Projeção recomendada no ATTUAL ONE

Criar ou atualizar uma entidade lógica `casting_invitation_projection`, identificada por `invitation_id`, com os campos mínimos:

- `invitation_id`
- `production_id`
- `call_id`
- `shortlist_id`
- `talent_id`
- `telegram_linked_at`
- `prepared_at`
- `sent_at`
- `responded_at`
- `response_status` (`pending`, `accepted`, `declined`)
- `last_event_key`
- `last_event_type`
- `updated_at`

A implementação física pode usar nomes/tabelas equivalentes já existentes no ATTUAL ONE; o importante é preservar a semântica acima.

## Matriz de efeitos por evento

### 1. `casting.invitation.prepared`

**Significado:** o Casting 360 preparou um convite para um talento selecionado pela equipe humana.

**Efeito no ATTUAL ONE:**
- criar a projeção da convocação, caso ainda não exista;
- associar produção, convocação, shortlist, convite e talento;
- definir `prepared_at`;
- definir `response_status = pending` se ainda não houver resposta final;
- registrar o evento na linha do tempo/auditoria.

**Não fazer:**
- não considerar o convite como enviado;
- não disparar comunicação adicional;
- não marcar o talento como confirmado.

### 2. `casting.telegram.linked`

**Significado:** a identidade Telegram foi vinculada com sucesso ao talento correto.

**Efeito no ATTUAL ONE:**
- atualizar `telegram_linked_at`;
- marcar a disponibilidade do canal Telegram na projeção do talento/convite;
- registrar a vinculação na auditoria.

**Não fazer:**
- não enviar novo convite automaticamente pelo ONE;
- não substituir o Casting 360 como fonte de verdade do vínculo Telegram.

### 3. `casting.invitation.sent`

**Significado:** o convite foi efetivamente entregue ao fluxo de envio Telegram pelo Casting 360.

**Efeito no ATTUAL ONE:**
- definir `sent_at`;
- manter `response_status = pending` enquanto não houver resposta final;
- expor o convite como “aguardando resposta” nos painéis do ONE;
- registrar o envio na linha do tempo.

**Não fazer:**
- não interpretar envio como aceite;
- não iniciar contratação, pagamento ou escala definitiva.

### 4. `casting.invitation.accepted`

**Significado:** o talento aceitou o convite no Telegram.

**Efeito no ATTUAL ONE:**
- definir `responded_at`;
- definir `response_status = accepted`;
- atualizar a projeção operacional da produção para “talento aceito/confirmado para próxima etapa”;
- registrar o aceite na auditoria;
- liberar ações internas subsequentes do ONE que dependam explicitamente de aceite, sem executar ações irreversíveis automaticamente nesta primeira versão.

**Não fazer:**
- não considerar contratação jurídica concluída;
- não efetuar pagamento automático;
- não publicar escala externa sem regra própria e aprovação humana quando aplicável.

### 5. `casting.invitation.declined`

**Significado:** o talento recusou o convite no Telegram.

**Efeito no ATTUAL ONE:**
- definir `responded_at`;
- definir `response_status = declined`;
- retirar o convite da fila “aguardando resposta”;
- sinalizar à produção que será necessário selecionar outro nome ou reabrir a shortlist;
- registrar a recusa na auditoria.

**Não fazer:**
- não excluir o talento do cadastro geral;
- não bloquear o talento de futuras produções;
- não disparar automaticamente novo convite para outro talento sem decisão explícita da produção.

## Regras de precedência

Eventos podem chegar com atraso de rede. Para impedir regressão de estado:

- `accepted` e `declined` são estados finais da resposta daquele convite;
- `prepared`, `linked` ou `sent` recebidos depois de uma resposta final podem completar timestamps ausentes, mas não podem devolver `response_status` para `pending`;
- entre `accepted` e `declined`, o primeiro evento final processado deve prevalecer até existir uma regra explícita de correção manual/auditada;
- correções administrativas não devem reutilizar o mesmo `event_key`.

## Idempotência do efeito

O fluxo recomendado no receptor é:

1. autenticar;
2. validar envelope e `Idempotency-Key`;
3. inserir/consultar `integration_inbox` por `event_key`;
4. se já estiver `processed`, retornar sucesso idempotente sem novo efeito;
5. marcar como `processing`;
6. aplicar o efeito de negócio em transação;
7. marcar como `processed` e salvar `processed_at`;
8. em falha temporária, registrar erro/tentativa e permitir retry seguro.

## Critérios de aceite desta etapa

A implementação do ATTUAL ONE será considerada aderente quando:

- H01–H05 produzirem exatamente os efeitos definidos nesta matriz;
- o mesmo `event_key` repetido não alterar contadores nem repetir ações;
- eventos fora de ordem não regredirem estado final;
- `accepted` e `declined` ficarem visíveis na projeção operacional;
- nenhuma ação irreversível externa ocorrer automaticamente apenas por receber um evento do Casting.

## Próxima implementação

Quando o repositório real do ATTUAL ONE estiver disponível, aplicar esta matriz no handler de `POST /api/integrations/casting/events` e nos serviços internos do ONE. O endpoint deve permanecer fino: validar, persistir, despachar para o serviço de projeção e responder de forma idempotente.