/**
 * cart-manager.js — Cart operations (add, update, remove, quantity).
 *
 * Stock is enforced here: adding an item first reserves stock via ./stock.js,
 * so there is no runtime monkey-patching of the add-to-cart function anymore.
 */

import { getCart, saveCart, showToast } from "./utils.js";
import { checkAndDecreaseStock, reserveStock, increaseStock } from "./stock.js";

// Add a single product (optionally with sauces) to the cart.
async function addToCart(product, sauces = []) {
  try {
    // Reserve stock first; bail out if the item is sold out.
    if (!checkAndDecreaseStock(product.id)) return false;

    const cart = getCart();
    const saucePrice = sauces.reduce(
      (total, sauce) => total + (sauce === "original" ? 0 : 1000),
      0
    );
    const totalPrice = product.price + saucePrice;

    const existingItem = cart.find((item) => {
      if (item.id !== product.id) return false;
      if (!item.sauces?.length && !sauces.length) return true;
      if (!item.sauces?.length || !sauces.length ||
          item.sauces.length !== sauces.length) return false;
      return [...item.sauces].sort().join(",") === [...sauces].sort().join(",");
    });

    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({
        ...product,
        sauces,
        price: totalPrice,
        originalPrice: product.price,
        quantity: 1,
        sauceDetails: sauces.map((sauce) => ({
          name: sauce,
          price: sauce === "original" ? 0 : 1000,
        })),
      });
    }

    saveCart(cart);
    return true;
  } catch (error) {
    console.error("Error in addToCart:", error);
    return false;
  }
}

function decreaseQuantity(index) {
  const cart = getCart();
  const item = cart[index];
  if (!item) return false;
  if (item.quantity > 1) {
    item.quantity--;
    increaseStock(item.id, 1); // return the freed unit to stock
    saveCart(cart);
    showToast("Quantity Updated", `${item.name} quantity decreased to ${item.quantity}`);
    return true;
  }
  return false;
}

function increaseQuantity(index) {
  const cart = getCart();
  const item = cart[index];
  if (!item) return false;
  // Reserve one more unit; refuse if the product is out of stock.
  if (!checkAndDecreaseStock(item.id)) return false;
  item.quantity++;
  saveCart(cart);
  showToast("Quantity Updated", `${item.name} quantity increased to ${item.quantity}`);
  return true;
}

function updateQuantity(index, newQuantity) {
  const cart = getCart();
  const item = cart[index];
  if (!item || !Number.isFinite(newQuantity) || newQuantity < 1) return false;

  const delta = newQuantity - item.quantity;
  if (delta > 0) {
    // Need to reserve extra units — bail out if stock can't cover it.
    if (!reserveStock(item.id, delta)) return false;
  } else if (delta < 0) {
    increaseStock(item.id, -delta); // return the freed units
  }

  item.quantity = newQuantity;
  saveCart(cart);
  showToast("Quantity Updated", `${item.name} quantity updated to ${newQuantity}`);
  return true;
}

function removeItem(index) {
  const cart = getCart();
  const item = cart[index];
  if (!item) return false;
  increaseStock(item.id, item.quantity); // return all reserved units
  cart.splice(index, 1);
  saveCart(cart);
  showToast("Item Removed", `${item.name} has been removed from your cart`);
  return true;
}

function clearCart() {
  // Return every reserved unit to stock before emptying the cart.
  getCart().forEach((item) => increaseStock(item.id, item.quantity));
  saveCart([]);
  showToast("Cart Cleared", "All items have been removed from your cart");
  return true;
}

export {
  addToCart,
  decreaseQuantity,
  increaseQuantity,
  updateQuantity,
  removeItem,
  clearCart,
};
