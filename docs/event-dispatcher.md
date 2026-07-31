# Event Dispatcher — Casting Attual 360 → ATTUAL ONE

## Objetivo

Enviar ao ATTUAL ONE os eventos pendentes registrados em `public.integration_events`, sem acesso direto entre os bancos dos dois sistemas.

Endpoint do Casting:

```text
POST /api/integrations/dispatch
```

## Segurança

A chamada ao dispatcher deve incluir:

```text
x-integration-dispatch-secret: <INTEGRATION_DISPATCH_SECRET>
```

O dispatcher envia os eventos ao ATTUAL ONE com:

```text
authorization: Bearer <ATTUAL_ONE_INTEGRATION_SECRET>
idempotency-key: <event_key>
```

Nenhum segredo pode usar o prefixo `NEXT_PUBLIC_`.

## Variáveis de ambiente

```text
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
INTEGRATION_DISPATCH_SECRET=
ATTUAL_ONE_EVENTS_URL=
ATTUAL_ONE_INTEGRATION_SECRET=
```

## Regras do lote

- processa até 20 eventos por chamada;
- aceita eventos com destino `attual-one`;
- lê estados `pendente` e `falhou`;
- limita cada evento a 10 tentativas;
- altera o estado para `processando` antes do envio;
- recupera eventos presos em `processando` por mais de 15 minutos;
- marca como `processado` após resposta HTTP de sucesso;
- marca como `falhou` e registra `ultimo_erro` em caso de erro;
- usa timeout de 10 segundos por entrega.

## Recuperação de interrupções

Antes de consultar a fila, o dispatcher procura eventos destinados ao ATTUAL ONE que estejam em `processando` e sem atualização há mais de 15 minutos. Esses registros voltam para `falhou` e ficam disponíveis para nova tentativa, desde que ainda não tenham atingido o limite de 10 tentativas.

A resposta do endpoint inclui o campo `recovered`, informando quantos eventos presos foram liberados naquela execução.

Essa recuperação cobre interrupções do processo, timeout da função, reinício do deploy e falha ocorrida depois da captura do evento. A idempotência no ATTUAL ONE continua obrigatória, pois um evento pode ter sido recebido antes de o Casting registrar a confirmação.

## Envelope enviado

```json
{
  "event_id": "uuid",
  "event_key": "uuid",
  "event_type": "talent.telegram.linked.v1",
  "event_version": 1,
  "source_system": "casting-attual-360",
  "target_system": "attual-one",
  "organization_external_id": null,
  "project_external_id": null,
  "talent_id": "uuid",
  "occurred_at": "2026-07-31T00:00:00.000Z",
  "payload": {}
}
```

## Resposta esperada do ATTUAL ONE

Qualquer resposta HTTP entre 200 e 299 confirma o recebimento. O consumidor do ATTUAL ONE deve tratar `idempotency-key` como chave única e retornar sucesso também quando o mesmo evento já tiver sido processado.

## Acionamento recomendado

No MVP, o endpoint pode ser chamado por um cron seguro da Vercel ou por uma automação do n8n a cada minuto. O agendador deve guardar o segredo somente no servidor.

Exemplo de chamada:

```bash
curl -X POST "https://casting.example.com/api/integrations/dispatch" \
  -H "x-integration-dispatch-secret: SEU_SEGREDO"
```

## Critérios de aceite

1. Evento pendente muda para `processado` após confirmação do ATTUAL ONE.
2. Evento não entregue muda para `falhou` e registra mensagem curta do erro.
3. Nova execução reprocessa falhas sem criar um novo evento.
4. Evento interrompido em `processando` volta à fila após 15 minutos.
5. Reenvio do mesmo `event_key` não duplica registros no ATTUAL ONE.
6. Chamada sem segredo válido retorna HTTP 401.
