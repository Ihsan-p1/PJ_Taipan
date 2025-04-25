/**
 * cart-manager.js - Cart operations (add, update, remove)
 * Manages cart interactions across the site
 */

import { getCart, saveCart, formatRupiah, showToast } from "./utils.js";

// Agar proses lebih cepat, kita simpan cache untuk pemetaan produk
let productCache = {};

// FIXED: removed duplicate export and made export pattern consistent
// Add product to cart - dioptimalkan untuk kecepatan
async function addToCart(product, sauces = []) {
  try {
    const cart = getCart();
    
    // Calculate total price including sauces
    const saucePrice = sauces.reduce((total, sauce) => 
      total + (sauce === "original" ? 0 : 1000), 0);
    const totalPrice = product.price + saucePrice;

    // Find existing item
    const existingItem = cart.find(item => {
      if (item.id !== product.id) return false;
      if (!item.sauces?.length && !sauces.length) return true;
      if (!item.sauces?.length || !sauces.length || 
          item.sauces.length !== sauces.length) return false;
      
      return item.sauces.sort().join(',') === sauces.sort().join(',');
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
        sauceDetails: sauces.map(sauce => ({
          name: sauce,
          price: sauce === "original" ? 0 : 1000,
        })),
      });
    }

    // Save cart
    saveCart(cart);

    // Update cart count
    const cartCount = document.querySelector(".cart-count");
    if (cartCount) {
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCount.textContent = count;
      cartCount.style.display = count > 0 ? "block" : "none";
    }

    return true;
  } catch (error) {
    console.error('Error in addToCart:', error);
    return false;
  }
}

// FIXED: Ensure addBundleToCart is properly defined and not re-exported
// Add bundle to cart - sudah efisien
function addBundleToCart(bundleType, bundles, products) {
  const bundle = bundles[bundleType];
  const cart = getCart();
  const bundleName =
    bundleType.charAt(0).toUpperCase() + bundleType.slice(1) + " Bundle";

  // Tambahkan setiap item bundle ke keranjang
  bundle.items.forEach((item) => {
    const product = products.find((p) => p.name === item.name);
    if (product) {
      for (let i = 0; i < item.quantity; i++) {
        cart.push({
          ...product,
          sauces: [],
          price: product.price,
          originalPrice: product.price,
          quantity: 1,
          bundleInfo: {
            name: bundleName,
            type: bundleType,
          },
        });
      }
    }
  });

  saveCart(cart);
  showToast("Bundle Added", `${bundleName} has been added to your cart`);
  return true;
}

// Fungsi-fungsi lain tetap sama karena cukup sederhana
function decreaseQuantity(index) {
  const cart = getCart();

  if (cart[index].quantity > 1) {
    cart[index].quantity--;
    saveCart(cart);
    showToast(
      "Quantity Updated",
      `${cart[index].name} quantity decreased to ${cart[index].quantity}`
    );
    return true;
  }
  return false;
}

function increaseQuantity(index) {
  const cart = getCart();

  cart[index].quantity++;
  saveCart(cart);
  showToast(
    "Quantity Updated",
    `${cart[index].name} quantity increased to ${cart[index].quantity}`
  );
  return true;
}

function updateQuantity(index, newQuantity) {
  if (newQuantity > 0) {
    const cart = getCart();
    cart[index].quantity = newQuantity;
    saveCart(cart);
    showToast(
      "Quantity Updated",
      `${cart[index].name} quantity updated to ${newQuantity}`
    );
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
  localStorage.removeItem("sate_taipan_cart");
  saveCart([]);
  showToast("Cart Cleared", "All items have been removed from your cart");
  return true;
}

// Export all functions together in a consistent way
export {
  addToCart,
  addBundleToCart,
  decreaseQuantity,
  increaseQuantity,
  updateQuantity,
  removeItem,
  clearCart,
};