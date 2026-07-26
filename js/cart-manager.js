/**
 * cart-manager.js — Cart operations (add, update, remove, quantity).
 *
 * Stock is enforced here: adding an item first reserves stock via ./stock.js,
 * so there is no runtime monkey-patching of the add-to-cart function anymore.
 */

import { getCart, saveCart, showToast } from "./utils.js";
import { checkAndDecreaseStock } from "./stock.js";

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
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
    saveCart(cart);
    showToast("Quantity Updated", `${cart[index].name} quantity decreased to ${cart[index].quantity}`);
    return true;
  }
  return false;
}

function increaseQuantity(index) {
  const cart = getCart();
  cart[index].quantity++;
  saveCart(cart);
  showToast("Quantity Updated", `${cart[index].name} quantity increased to ${cart[index].quantity}`);
  return true;
}

function updateQuantity(index, newQuantity) {
  if (newQuantity > 0) {
    const cart = getCart();
    cart[index].quantity = newQuantity;
    saveCart(cart);
    showToast("Quantity Updated", `${cart[index].name} quantity updated to ${newQuantity}`);
    return true;
  }
  return false;
}

function removeItem(index) {
  const cart = getCart();
  const itemName = cart[index].name;
  cart.splice(index, 1);
  saveCart(cart);
  showToast("Item Removed", `${itemName} has been removed from your cart`);
  return true;
}

function clearCart() {
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
