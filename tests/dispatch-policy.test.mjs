import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";

import {
  classifyDispatchFailure,
  isRetryDue,
  signedCastingHeaders,
} from "../src/lib/integrations/dispatch-policy.ts";

test("classifica falhas permanentes e transitorias", () => {
  assert.equal(classifyDispatchFailure(401), "permanent");
  assert.equal(classifyDispatchFailure(422), "permanent");
  assert.equal(classifyDispatchFailure(429), "transient");
  assert.equal(classifyDispatchFailure(500), "transient");
  assert.equal(classifyDispatchFailure(null), "transient");
});

test("aplica backoff antes de liberar nova tentativa", () => {
  const updatedAt = "2026-08-26T00:00:00.000Z";
  const base = Date.parse(updatedAt);
  assert.equal(isRetryDue(1, updatedAt, base + 29_999), false);
  assert.equal(isRetryDue(1, updatedAt, base + 30_000), true);
  assert.equal(isRetryDue(3, updatedAt, base + 599_999), false);
});

test("assina o envelope canonico", () => {
  const body = JSON.stringify({ event_key: "evt-1" });
  const headers = signedCastingHeaders({
    body,
    eventKey: "evt-1",
    path: "/api/integrations/casting/events",
    secret: "test-secret",
    timestamp: 1_787_702_400,
  });
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const expected = createHmac("sha256", "test-secret")
    .update(`1787702400\nPOST\n/api/integrations/casting/events\nevt-1\n${bodyHash}`)
    .digest("hex");
  assert.equal(headers["x-attual-signature"], expected);
});
