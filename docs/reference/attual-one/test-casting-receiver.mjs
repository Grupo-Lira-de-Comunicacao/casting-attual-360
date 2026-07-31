#!/usr/bin/env node

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.ATTUAL_ONE_EVENTS_URL;
const secret = process.env.ATTUAL_ONE_INTEGRATION_SECRET;

if (!baseUrl || !secret) {
  console.error(
    "Defina ATTUAL_ONE_EVENTS_URL e ATTUAL_ONE_INTEGRATION_SECRET antes de executar.",
  );
  process.exit(2);
}

const results = [];

function event(overrides = {}) {
  const eventId = randomUUID();
  return {
    event_id: eventId,
    event_key: `casting:test:${eventId}`,
    event_type: "talent.telegram.linked.v1",
    event_version: 1,
    source_system: "casting-attual-360",
    target_system: "attual-one",
    organization_external_id: "grupo-lira",
    project_external_id: "casting-attual-360",
    talent_id: `test-talent-${randomUUID()}`,
    occurred_at: new Date().toISOString(),
    payload: {
      telegram_user_id: "999000111",
      telegram_chat_id: "999000111",
      telegram_username: "casting_contract_test",
      linked_at: new Date().toISOString(),
    },
    ...overrides,
  };
}

async function post(body, options = {}) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${options.secret ?? secret}`,
    "idempotency-key": options.idempotencyKey ?? body.event_key ?? "missing",
  };

  const response = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  return { status: response.status, json };
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.error(`✗ ${name}: ${error.message}`);
  }
}

await test("rejeita autenticação inválida", async () => {
  const body = event();
  const response = await post(body, { secret: `${secret}-invalido` });
  assert.equal(response.status, 401);
});

await test("rejeita payload incompleto", async () => {
  const body = event({ event_type: "" });
  const response = await post(body);
  assert.equal(response.status, 400);
});

await test("rejeita chave de idempotência divergente", async () => {
  const body = event();
  const response = await post(body, { idempotencyKey: `${body.event_key}:outra` });
  assert.equal(response.status, 400);
});

let acceptedEvent;
await test("aceita o primeiro recebimento", async () => {
  acceptedEvent = event();
  const response = await post(acceptedEvent);
  assert.equal(response.status, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.duplicate, false);
  assert.equal(response.json.event_key, acceptedEvent.event_key);
});

await test("trata reenvio como duplicado", async () => {
  assert.ok(acceptedEvent, "O teste de primeiro recebimento precisa ter sucesso.");
  const response = await post(acceptedEvent);
  assert.equal(response.status, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.duplicate, true);
});

await test("registra evento desconhecido como ignorado", async () => {
  const body = event({ event_type: "talent.unknown.contract-test.v1" });
  const response = await post(body);
  assert.equal(response.status, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.ignored, true);
});

await test("registra falha de processamento do vínculo incompleto", async () => {
  const body = event({
    payload: {
      telegram_user_id: "999000111",
      telegram_chat_id: "999000111",
    },
  });
  const response = await post(body);
  assert.equal(response.status, 500);
  assert.match(response.json.error ?? "", /registrado.*não processado/i);
});

const failed = results.filter((item) => !item.ok);
console.log(`\nResultado: ${results.length - failed.length}/${results.length} testes aprovados.`);

if (failed.length > 0) {
  process.exit(1);
}
