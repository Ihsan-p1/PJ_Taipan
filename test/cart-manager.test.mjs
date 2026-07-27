// Unit tests for cart operations and their stock interaction (js/cart-manager.js).
import "./_setup.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetStorage } from "./_setup.mjs";
import {
  addToCart,
  removeItem,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} from "../js/cart-manager.js";
import { getRemainingStock } from "../js/stock.js";
import { getCart } from "../js/utils.js";
import { products } from "../js/data/products.js";

const moza = products.find((p) => p.id === 2); // plenty of stock

beforeEach(() => {
  clearCart(); // returns any reserved stock, then empties the cart
  resetStorage();
});

test("addToCart reserves stock and removeItem returns it", async () => {
  const start = getRemainingStock(2);
  await addToCart(moza);
  await addToCart(moza);
  assert.equal(getRemainingStock(2), start - 2);
  assert.equal(getCart()[0].quantity, 2);

  removeItem(0);
  assert.equal(getRemainingStock(2), start, "removing must return all reserved units");
  assert.equal(getCart().length, 0);
});

test("decreaseQuantity returns exactly one unit to stock", async () => {
  await addToCart(moza);
  await addToCart(moza);
  const start = getRemainingStock(2);
  decreaseQuantity(0);
  assert.equal(getRemainingStock(2), start + 1);
  assert.equal(getCart()[0].quantity, 1);
});

test("clearCart returns every reserved unit", async () => {
  const start = getRemainingStock(2);
  await addToCart(moza);
  await addToCart(moza);
  await addToCart(moza);
  assert.equal(getRemainingStock(2), start - 3);
  clearCart();
  assert.equal(getRemainingStock(2), start);
});

test("increaseQuantity refuses when the item is out of stock", async () => {
  const low = products.find((p) => p.id === 1); // id 1 seeded low (4)
  await addToCart(low);
  // Exhaust remaining stock via the cart.
  let guard = 0;
  while (getRemainingStock(1) > 0 && guard++ < 100) increaseQuantity(0);
  assert.equal(getRemainingStock(1), 0);

  const qtyBefore = getCart()[0].quantity;
  assert.equal(increaseQuantity(0), false, "should refuse with no stock left");
  assert.equal(getCart()[0].quantity, qtyBefore, "quantity must not change");
});
