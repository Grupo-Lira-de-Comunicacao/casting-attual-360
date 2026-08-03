# Missão 13 — Auditoria e observabilidade do receptor ATTUAL ONE

## Objetivo

Definir o conjunto mínimo de evidências técnicas e operacionais que o ATTUAL ONE deve registrar ao consumir eventos do Casting Attual 360. A meta é tornar cada entrega, retry, conflito, correção e efeito de negócio rastreável sem depender de leitura manual de logs dispersos.

## Princípios

1. Todo evento recebido deve deixar rastro, inclusive duplicados e inválidos.
2. O registro de auditoria é append-only para fatos de integração; correções administrativas geram novos registros em vez de apagar o histórico.
3. Dados pessoais devem ser minimizados. Identificadores técnicos são preferíveis a conteúdo de mensagens do Telegram.
4. Observabilidade deve permitir responder rapidamente: o que chegou, quando chegou, o que foi feito, por que falhou e se houve retry.
5. Idempotência deve ser visível: reenvio do mesmo `event_key` precisa ser reconhecível sem duplicar efeito de negócio.

## Correlação obrigatória

Cada recepção deve preservar, quando existente:

- `event_key`
- `event_type`
- `event_version`
- `invitation_id`
- `talent_id`
- `casting_id` ou contexto equivalente
- `source`
- `destination`
- `correlation_id`
- `causation_id`
- `received_at`
- `processed_at`

Se `correlation_id` não vier do produtor, o receptor pode gerar um identificador local, mas nunca deve substituir um valor recebido.

## integration_inbox

A `integration_inbox` deve guardar o estado técnico de processamento do evento.

Campos mínimos recomendados:

- `id`
- `event_key` UNIQUE
- `event_type`
- `event_version`
- `payload_hash`
- `source`
- `destination`
- `received_at`
- `processing_status`: `received | processed | duplicate | rejected | failed`
- `attempt_count`
- `last_attempt_at`
- `processed_at`
- `http_result`
- `error_code`
- `error_summary`

O payload bruto só deve ser armazenado quando necessário para suporte e dentro da política de retenção. Quando não for indispensável, preferir hash + campos normalizados.

## Audit trail de negócio

Separar o status técnico da inbox do histórico de efeito de negócio. Para cada mudança na projeção do convite, registrar:

- estado anterior
- estado novo
- `event_key` causador
- regra aplicada
- timestamp
- resultado: `applied | ignored | conflict | administrative_override`
- ator, quando houver ação humana
- justificativa obrigatória para override administrativo

Exemplo: um `sent` atrasado após `accepted` entra na inbox como recebido/processado, mas no audit trail de negócio aparece como `ignored` por proteção contra regressão.

## Retries

Cada tentativa de entrega deve ser observável sem criar novo efeito de negócio.

Registrar no receptor:

- contador de tentativas observadas
- última tentativa
- resultado da tentativa
- motivo resumido de falha

No produtor/dispatcher, manter também:

- número da tentativa
- próximo retry programado
- último código HTTP
- última mensagem técnica de erro

Não registrar tokens, segredos ou cabeçalhos de autenticação.

## Conflitos de estado

Conflitos `accepted ↔ declined` devem gerar ocorrência de severidade alta para revisão operacional.

O registro precisa conter:

- `invitation_id`
- estado vigente
- estado conflitante recebido
- `event_key` do evento vigente, se disponível
- `event_key` conflitante
- timestamps
- status da revisão: `open | resolved`
- decisão administrativa e justificativa, quando resolvido

O receptor não pode aplicar automaticamente "último evento vence" para estados finais conflitantes.

## Correção administrativa

Override administrativo exige:

- usuário/ator autenticado
- motivo textual obrigatório
- estado anterior
- estado corrigido
- timestamp
- referência ao conflito ou incidente, quando aplicável

A correção não altera o fato histórico que veio do Casting 360; cria uma nova decisão auditável na projeção do ATTUAL ONE.

## Logs estruturados

Logs do receptor devem ser estruturados e conter pelo menos:

- `level`
- `service=attual-one`
- `component=casting-integration`
- `event_key`
- `event_type`
- `invitation_id`
- `correlation_id`
- `outcome`
- `duration_ms`
- `error_code`, quando houver

Evitar nome completo, telefone, username do Telegram ou texto integral de mensagens em logs técnicos.

## Métricas mínimas

- `casting_events_received_total`
- `casting_events_processed_total`
- `casting_events_duplicate_total`
- `casting_events_rejected_total`
- `casting_events_failed_total`
- `casting_state_conflicts_total`
- `casting_admin_overrides_total`
- `casting_event_processing_duration_ms`

Dimensões seguras: `event_type`, `event_version`, `outcome`. Não usar `talent_id` ou `invitation_id` como label de métrica para evitar alta cardinalidade.

## Alertas recomendados

### A01 — falhas consecutivas
Disparar quando houver sequência anormal de `5xx` ou crescimento de `failed`.

### A02 — conflitos finais
Disparar sempre que houver conflito `accepted/declined` para o mesmo convite.

### A03 — backlog
Disparar quando eventos em `received` permanecerem sem processamento além da janela operacional definida.

### A04 — rejeições por contrato
Disparar quando crescerem eventos rejeitados por versão, schema, origem ou destino inválidos.

## Retenção

Recomendação inicial:

- métricas agregadas: retenção longa conforme ferramenta adotada;
- logs técnicos: 30 a 90 dias;
- inbox/audit trail: conforme necessidade operacional e política de dados do ATTUAL ONE;
- segredos: nunca registrar.

A retenção definitiva deve acompanhar a política geral de privacidade e segurança do Grupo Lira.

## Critérios de aceite O01–O10

| ID | Cenário | Evidência esperada |
|---|---|---|
| O01 | evento válido processado | inbox `processed` + audit trail `applied` |
| O02 | duplicado pelo mesmo `event_key` | inbox/contador indica duplicata; sem novo efeito |
| O03 | payload inválido | `rejected` + `error_code`, sem efeito de negócio |
| O04 | falha interna temporária | `failed`, tentativa registrada e retry seguro |
| O05 | evento atrasado regressivo | técnico processado; negócio `ignored` |
| O06 | conflito accepted/declined | ocorrência de conflito aberta; estado preservado |
| O07 | override administrativo | ator + motivo + antes/depois registrados |
| O08 | latência de processamento | `duration_ms` e métrica disponíveis |
| O09 | rastreio ponta a ponta | `correlation_id` permite localizar produtor e receptor |
| O10 | inspeção de logs | nenhuma credencial ou segredo exposto |

## Definition of Done da Missão 13

A especificação estará pronta quando o futuro receptor do ATTUAL ONE puder implementar os casos O01–O10 sem decisão arquitetural adicional sobre rastreabilidade. A implementação concreta continua pertencendo ao repositório real do ATTUAL ONE, não ao Casting Attual 360.
