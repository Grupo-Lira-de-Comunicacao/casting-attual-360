import assert from "node:assert/strict";
import test from "node:test";

import {
  isRetryDue,
  retryDelayMs,
} from "../src/lib/integrations/dispatch-policy.ts";

test("jitter is stable and bounded per event", () => {
  const delayA = retryDelayMs(1, "event-a");
  const delayARepeat = retryDelayMs(1, "event-a");
  const delayB = retryDelayMs(1, "event-b");

  assert.equal(delayA, delayARepeat);
  assert.ok(delayA >= 30_000 && delayA <= 36_000);
  assert.ok(delayB >= 30_000 && delayB <= 36_000);
  assert.notEqual(delayA, delayB);
});

test("retry threshold stays stable during an attempt window", () => {
  const updatedAt = "2026-08-26T00:00:00.000Z";
  const base = Date.parse(updatedAt);
  const delay = retryDelayMs(2, "event-stable");

  assert.equal(isRetryDue(2, updatedAt, base + delay - 1, "event-stable"), false);
  assert.equal(isRetryDue(2, updatedAt, base + delay, "event-stable"), true);
});
