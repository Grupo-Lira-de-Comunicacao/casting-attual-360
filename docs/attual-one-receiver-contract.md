# Contrato do receptor ATTUAL ONE — Casting Attual 360

## Objetivo

Definir o contrato HTTP que o ATTUAL ONE deverá implementar para receber, com segurança, idempotência e auditoria, os eventos produzidos pelo Casting Attual 360.

## Endpoint proposto

`POST /api/integrations/casting/events`

O endereço base será configurado no Casting 360 por variável de ambiente. O webhook do Telegram não deve chamar este endpoint diretamente: a entrega continua passando por `integration_events` e pelo dispatcher existente.

## Autenticação

Cabeçalhos obrigatórios:

- `Authorization: Bearer <ATTUAL_ONE_INTEGRATION_TOKEN>`
- `Content-Type: application/json`
- `Idempotency-Key: <event_key>`

O token deve existir apenas nos ambientes de execução e nunca no Git.

## Envelope v1

```json
{
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "event_type": "casting.invitation.sent",
  "event_key": "<identificador-unico>",
  "occurred_at": "2026-08-03T12:00:00.000Z",
  "context": {
    "production_id": "uuid",
    "casting_call_id": "uuid",
    "shortlist_id": "uuid",
    "invitation_id": "uuid",
    "talent_id": "uuid"
  },
  "data": {}
}
```

O receptor deve rejeitar versões não suportadas explicitamente, sem tentar interpretar silenciosamente um contrato futuro.

## Eventos oficiais v1

1. `casting.invitation.prepared`
2. `casting.telegram.linked`
3. `casting.invitation.sent`
4. `casting.invitation.accepted`
5. `casting.invitation.declined`

## Idempotência

O ATTUAL ONE deve persistir `event_key` com restrição UNIQUE antes de executar efeitos de negócio. Uma repetição do mesmo evento não pode duplicar histórico, notificação, tarefa ou mudança de estado.

Comportamento recomendado para duplicata já processada: responder `200` ou `204`, tratando-a como sucesso idempotente.

## Respostas HTTP

- `200`/`204`: recebido e processado, inclusive duplicata já concluída.
- `202`: aceito para processamento assíncrono; o ONE assumiu responsabilidade pela execução.
- `400`: envelope/payload inválido; não adianta retry sem correção.
- `401`/`403`: autenticação/autorização inválida; interromper retries agressivos e alertar operação.
- `409`: usar apenas se houver conflito recuperável que realmente deva ser tentado novamente. Duplicata normal não deve retornar 409.
- `422`: evento conhecido, porém semanticamente inválido; requer análise/correção.
- `429`: limite temporário; dispatcher pode tentar novamente com backoff.
- `5xx`: falha temporária; dispatcher deve tentar novamente.

## Auditoria no ATTUAL ONE

Tabela/estrutura sugerida: `integration_inbox`.

Campos mínimos:

- `id`
- `event_key` UNIQUE
- `event_type`
- `event_version`
- `source_system`
- `payload` JSON/JSONB
- `status` (`received`, `processing`, `processed`, `failed`)
- `attempts`
- `last_error`
- `received_at`
- `processed_at`

A inbox é a fronteira de confiança do ONE: primeiro registra-se o evento, depois executam-se efeitos internos.

## Regra de processamento

Fluxo recomendado:

`HTTP -> autenticação -> validação do envelope -> insert idempotente na inbox -> processamento -> auditoria`

Se o processamento interno for assíncrono, o endpoint pode retornar `202` somente depois de o evento estar persistido com segurança.

## Retry e segurança

O dispatcher do Casting 360 continua responsável por retry de falhas de transporte. O ONE é responsável por garantir que retries sejam inofensivos por meio de `event_key`.

Nunca registrar tokens de autenticação em logs. Payloads devem ser limitados ao necessário para a integração; dados pessoais não relacionados ao evento não devem ser enviados.

## Critérios de aceite ponta a ponta

Para cada um dos cinco eventos:

1. evento é criado em `integration_events` no Casting 360;
2. dispatcher envia envelope v1 com `Idempotency-Key`;
3. ONE autentica e persiste na inbox;
4. ONE processa uma única vez;
5. Casting marca entrega como processada após resposta de sucesso;
6. reenvio do mesmo `event_key` não duplica efeitos;
7. falha 5xx permanece recuperável por retry e auditável nos dois lados.

## Fora do escopo desta etapa

- aplicar migration no banco do ATTUAL ONE;
- definir URL de produção;
- cadastrar tokens reais;
- ativar tráfego com talentos reais;
- acoplar o webhook Telegram diretamente ao ATTUAL ONE.
