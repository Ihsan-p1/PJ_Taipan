// Unit tests for the stock service (js/stock.js).
// Tests use deltas from the current remaining amount so they don't depend on
// the module's in-memory cache being reset between cases.
import "./_setup.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getRemainingStock,
  checkAndDecreaseStock,
  reserveStock,
  increaseStock,
  checkAndDecreaseBundleStock,
} from "../js/stock.js";

test("checkAndDecreaseStock decrements one unit when available", () => {
  const before = getRemainingStock(2);
  assert.equal(checkAndDecreaseStock(2), true);
  assert.equal(getRemainingStock(2), before - 1);
});

test("increaseStock returns units to the pool", () => {
  const before = getRemainingStock(2);
  increaseStock(2, 3);
  assert.equal(getRemainingStock(2), before + 3);
});

test("reserveStock refuses to over-reserve and never goes negative", () => {
  const available = getRemainingStock(2);
  assert.equal(reserveStock(2, available + 1), false);
  assert.equal(getRemainingStock(2), available); // unchanged on failure
  assert.equal(reserveStock(2, 2), true);
  assert.equal(getRemainingStock(2), available - 2);
});

test("a sold-out item cannot be decremented (id 3 seeded to 0)", () => {
  // Drain id 3 to be safe, then assert it refuses.
  let guard = 0;
  while (getRemainingStock(3) > 0 && guard++ < 100) checkAndDecreaseStock(3);
  assert.equal(getRemainingStock(3), 0);
  assert.equal(checkAndDecreaseStock(3), false);
});

test("bundle stock is reserved atomically or not at all", () => {
  const a = getRemainingStock(1);
  const b = getRemainingStock(2);
  // A request that can't be fully satisfied must reserve nothing.
  assert.equal(
    checkAndDecreaseBundleStock([
      { id: 1, quantity: 1 },
      { id: 2, quantity: b + 5 },
    ]),
    false
  );
  assert.equal(getRemainingStock(1), a, "id 1 must be untouched on failure");
  assert.equal(getRemainingStock(2), b, "id 2 must be untouched on failure");

  // A satisfiable request decrements every line.
  assert.equal(
    checkAndDecreaseBundleStock([
      { id: 1, quantity: 1 },
      { id: 2, quantity: 1 },
    ]),
    true
  );
  assert.equal(getRemainingStock(1), a - 1);
  assert.equal(getRemainingStock(2), b - 1);
});
