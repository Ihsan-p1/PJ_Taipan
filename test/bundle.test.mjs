// Regression test for the bundle "mozzarella" bug: bundle items must resolve
// by product id, so no paid item is silently dropped from the cart.
import "./_setup.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { addBundleToCart } from "../js/bundle-display.js";
import { getCart } from "../js/utils.js";

test("family bundle adds all 10 items including 2 mozzarella (id 2)", () => {
  assert.equal(addBundleToCart("family"), true);
  const cart = getCart();
  // 3 original (id 1) + 2 mozzarella (id 2) + 5 tea (id 4)
  assert.equal(cart.length, 10, "no bundle item should be dropped");
  assert.equal(
    cart.filter((item) => item.id === 2).length,
    2,
    "mozzarella must not be silently dropped (the fixed bug)"
  );
});
