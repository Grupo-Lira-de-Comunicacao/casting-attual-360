# Testes de contrato — Casting Attual 360 → ATTUAL ONE

Arquivo executável:

```text
docs/reference/attual-one/test-casting-receiver.mjs
```

## Pré-requisitos

O receptor do ATTUAL ONE precisa estar publicado e com a migration `001_create_casting_integration_receiver.sql` aplicada.

Configure apenas no terminal ou ambiente seguro:

```bash
export ATTUAL_ONE_EVENTS_URL="https://SEU-DOMINIO/api/integrations/casting/events"
export ATTUAL_ONE_INTEGRATION_SECRET="SEGREDO-COMPARTILHADO"
```

Execute:

```bash
node docs/reference/attual-one/test-casting-receiver.mjs
```

## Cenários cobertos

1. segredo inválido retorna `401`;
2. payload incompleto retorna `400`;
3. chave de idempotência divergente retorna `400`;
4. primeiro recebimento válido é processado;
5. reenvio do mesmo `event_key` retorna sucesso como duplicado;
6. evento ainda não suportado é registrado como `ignored`;
7. vínculo Telegram com payload incompleto é registrado como `failed` e retorna `500`.

## Resultado esperado

```text
Resultado: 7/7 testes aprovados.
```

Os testes criam identificadores aleatórios e não devem usar talentos reais. Os registros de contrato podem ser removidos posteriormente usando o prefixo `casting:test:` no campo `event_key`.

## Critério de liberação

A integração só deve ser habilitada no dispatcher de produção após os sete testes passarem no ambiente de homologação. Em produção, execute apenas uma vez após a implantação inicial ou depois de alterações no contrato do receptor.
