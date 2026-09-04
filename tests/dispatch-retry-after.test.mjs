import assert from "node:assert/strict";
import test from "node:test";

import {
  isScheduledRetryDue,
  retryAfterAt,
} from "../src/lib/integrations/dispatch-policy.ts";

test("Retry-After delta-seconds creates a future schedule", () => {
  const now = Date.parse("2026-09-03T22:00:00.000Z");

  assert.equal(
    retryAfterAt("120", now),
    "2026-09-03T22:02:00.000Z",
  );
});

test("Retry-After HTTP-date is honored", () => {
  const now = Date.parse("2026-09-03T22:00:00.000Z");

  assert.equal(
    retryAfterAt("Thu, 03 Sep 2026 22:05:00 GMT", now),
    "2026-09-03T22:05:00.000Z",
  );
});

test("invalid Retry-After falls back to normal backoff", () => {
  const now = Date.parse("2026-09-03T22:00:00.000Z");

  assert.equal(retryAfterAt("not-a-date", now), null);
  assert.equal(retryAfterAt(null, now), null);
});

test("scheduled retry is blocked until the requested instant", () => {
  const schedule = "2026-09-03T22:05:00.000Z";

  assert.equal(
    isScheduledRetryDue(schedule, Date.parse("2026-09-03T22:04:59.999Z")),
    false,
  );
  assert.equal(
    isScheduledRetryDue(schedule, Date.parse("2026-09-03T22:05:00.000Z")),
    true,
  );
  assert.equal(isScheduledRetryDue(null, Date.now()), true);
});
