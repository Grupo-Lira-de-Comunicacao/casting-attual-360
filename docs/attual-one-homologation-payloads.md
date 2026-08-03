# Homologação controlada — Casting Attual 360 → ATTUAL ONE

## Objetivo

Disponibilizar payloads reproduzíveis para validar o receptor `POST /api/integrations/casting/events` sem depender de talentos reais, convites reais ou tráfego real do Telegram.

## Convenções

Use um token exclusivo de homologação e nunca reutilize credenciais de produção.

Cabeçalhos mínimos:

```http
Authorization: Bearer <ATTUAL_ONE_INTEGRATION_TOKEN>
Content-Type: application/json
Idempotency-Key: <event_key>
```

Todos os exemplos abaixo usam identificadores sintéticos.

## Envelope base

```json
{
  "event_key": "evt-hml-001",
  "event_type": "casting.invitation.prepared",
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "occurred_at": "2026-08-03T15:30:00.000Z",
  "context": {
    "production_id": "prod-hml-001",
    "casting_call_id": "call-hml-001",
    "shortlist_id": "short-hml-001",
    "invitation_id": "invite-hml-001",
    "talent_id": "talent-hml-001"
  },
  "data": {}
}
```

## H01 — convite preparado

```json
{
  "event_key": "evt-hml-prepared-001",
  "event_type": "casting.invitation.prepared",
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "occurred_at": "2026-08-03T15:30:00.000Z",
  "context": {
    "production_id": "prod-hml-001",
    "casting_call_id": "call-hml-001",
    "shortlist_id": "short-hml-001",
    "invitation_id": "invite-hml-001",
    "talent_id": "talent-hml-001"
  },
  "data": {
    "channel": "telegram",
    "status": "prepared"
  }
}
```

## H02 — Telegram vinculado

```json
{
  "event_key": "evt-hml-linked-001",
  "event_type": "casting.telegram.linked",
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "occurred_at": "2026-08-03T15:31:00.000Z",
  "context": {
    "production_id": "prod-hml-001",
    "casting_call_id": "call-hml-001",
    "shortlist_id": "short-hml-001",
    "invitation_id": "invite-hml-001",
    "talent_id": "talent-hml-001"
  },
  "data": {
    "channel": "telegram",
    "status": "linked"
  }
}
```

## H03 — convite enviado

```json
{
  "event_key": "evt-hml-sent-001",
  "event_type": "casting.invitation.sent",
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "occurred_at": "2026-08-03T15:32:00.000Z",
  "context": {
    "production_id": "prod-hml-001",
    "casting_call_id": "call-hml-001",
    "shortlist_id": "short-hml-001",
    "invitation_id": "invite-hml-001",
    "talent_id": "talent-hml-001"
  },
  "data": {
    "channel": "telegram",
    "status": "sent"
  }
}
```

## H04 — convite aceito

```json
{
  "event_key": "evt-hml-accepted-001",
  "event_type": "casting.invitation.accepted",
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "occurred_at": "2026-08-03T15:33:00.000Z",
  "context": {
    "production_id": "prod-hml-001",
    "casting_call_id": "call-hml-001",
    "shortlist_id": "short-hml-001",
    "invitation_id": "invite-hml-001",
    "talent_id": "talent-hml-001"
  },
  "data": {
    "channel": "telegram",
    "status": "accepted"
  }
}
```

## H05 — convite recusado

```json
{
  "event_key": "evt-hml-declined-001",
  "event_type": "casting.invitation.declined",
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "occurred_at": "2026-08-03T15:34:00.000Z",
  "context": {
    "production_id": "prod-hml-001",
    "casting_call_id": "call-hml-001",
    "shortlist_id": "short-hml-001",
    "invitation_id": "invite-hml-001",
    "talent_id": "talent-hml-001"
  },
  "data": {
    "channel": "telegram",
    "status": "declined"
  }
}
```

## Teste de idempotência

Para qualquer payload válido:

1. enviar o evento uma vez e registrar o status HTTP;
2. reenviar o mesmo corpo com o mesmo `Idempotency-Key`;
3. exigir sucesso novamente;
4. confirmar uma única linha lógica na `integration_inbox`;
5. confirmar um único efeito de negócio no ATTUAL ONE.

## Teste de falha temporária

1. forçar o receptor a responder `500` antes do processamento;
2. confirmar que o Casting não perde o evento;
3. restabelecer o receptor;
4. reenviar o mesmo `event_key`;
5. confirmar processamento único;
6. registrar quantidade de tentativas e estado final nos dois sistemas.

## Resultado mínimo esperado

A homologação só é considerada aprovada quando H01–H05 passarem, a duplicidade não gerar efeitos adicionais, uma falha `5xx` puder ser recuperada por retry e nenhuma credencial sensível aparecer em logs.

## Evidências

Para cada execução, registrar:

- `event_key`;
- status HTTP;
- timestamp;
- linha correspondente na `integration_inbox`;
- estado final;
- quantidade de tentativas;
- efeito de negócio gerado;
- confirmação de ausência de duplicidade.
