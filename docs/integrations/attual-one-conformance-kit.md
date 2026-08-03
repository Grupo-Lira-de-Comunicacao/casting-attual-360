# Kit de conformidade — receptor ATTUAL ONE

## Objetivo

Permitir validar a futura implementação do endpoint `POST /api/integrations/casting/events` sem depender de tráfego real do Telegram ou de talentos reais.

## Pré-condições do receptor

- autenticar `Authorization: Bearer <token>`;
- exigir `Content-Type: application/json`;
- exigir `Idempotency-Key` igual ao `event_key` do envelope;
- aceitar apenas `event_version = 1`;
- exigir `source_system = casting-attual-360` e `target_system = attual-one`;
- persistir o evento na `integration_inbox` antes de executar efeitos internos;
- garantir `event_key` UNIQUE;
- nunca registrar o token de autenticação em logs.

## Casos mínimos de conformidade

### C01 — convite preparado

Evento: `casting.invitation.prepared`

Esperado: `200`, `202` ou `204`, evento persistido uma única vez e auditável.

### C02 — Telegram vinculado

Evento: `casting.telegram.linked`

Esperado: vínculo refletido no domínio do ONE sem duplicar histórico caso o mesmo `event_key` seja reenviado.

### C03 — convite enviado

Evento: `casting.invitation.sent`

Esperado: registrar o envio/linha do tempo da convocação uma única vez.

### C04 — convite aceito

Evento: `casting.invitation.accepted`

Esperado: registrar aceite e permitir que fluxos internos do ONE avancem sem que um retry produza segunda confirmação.

### C05 — convite recusado

Evento: `casting.invitation.declined`

Esperado: registrar recusa uma única vez e preservar trilha de auditoria.

## Casos negativos obrigatórios

### N01 — token ausente ou inválido

Esperado: `401` ou `403`. Nenhum registro deve ser criado na inbox.

### N02 — versão desconhecida

Enviar `event_version = 999`.

Esperado: `400` ou `422`. O receptor não deve interpretar silenciosamente o payload.

### N03 — `Idempotency-Key` diferente de `event_key`

Esperado: `400` ou `422`.

### N04 — evento desconhecido

Enviar `event_type = casting.unknown`.

Esperado: `400` ou `422`.

### N05 — contexto obrigatório incompleto

Remover um dos identificadores obrigatórios: `production_id`, `casting_call_id`, `shortlist_id`, `invitation_id` ou `talent_id`.

Esperado: `400` ou `422`.

## Teste de idempotência

1. enviar um evento válido com `event_key = evt-test-001`;
2. confirmar resposta de sucesso;
3. reenviar exatamente o mesmo evento com o mesmo cabeçalho `Idempotency-Key`;
4. confirmar novamente resposta de sucesso idempotente;
5. verificar no ONE que existe apenas um registro lógico e apenas um efeito de negócio.

Duplicata normal não deve retornar `409`.

## Teste de retry

1. simular uma falha temporária `500` no receptor antes do processamento;
2. confirmar que o Casting mantém o evento recuperável no dispatcher;
3. restabelecer o receptor;
4. reenviar o mesmo `event_key`;
5. confirmar processamento único e estado final auditável nos dois sistemas.

## Matriz de aceite

| Caso | Resultado esperado |
|---|---|
| C01–C05 | evento recebido, persistido e processado uma única vez |
| N01 | rejeição de autenticação sem persistência |
| N02 | versão rejeitada explicitamente |
| N03 | inconsistência de idempotência rejeitada |
| N04 | tipo de evento desconhecido rejeitado |
| N05 | contexto incompleto rejeitado |
| Reenvio | sucesso idempotente, sem efeitos duplicados |
| Falha 5xx | recuperável por retry |

## Evidências que devem ser coletadas

Para considerar a integração pronta para produção, registrar para cada caso:

- status HTTP;
- `event_key` utilizado;
- registro correspondente na `integration_inbox`;
- estado final do processamento;
- quantidade de tentativas;
- ausência de efeitos duplicados;
- erro sanitizado quando aplicável.

## Critério de liberação

A integração Telegram → Casting Attual 360 → ATTUAL ONE só deve receber tráfego real depois que C01–C05, N01–N05, idempotência e retry forem aprovados em ambiente controlado.
