/**
 * utils.js - Utility functions for the Sate Taipan website
 * Contains functions for cart management, price formatting, and notifications
 */

// Load cart from localStorage
function getCart() {
  try {
    const cartData = localStorage.getItem("sate_taipan_cart");
    if (cartData) return JSON.parse(cartData);
    
    // Try fallback storages
    const sessionData = sessionStorage.getItem("sate_taipan_cart");
    if (sessionData) return JSON.parse(sessionData);
    
    return window._tempCart || [];
  } catch (error) {
    console.error('Error reading cart:', error);
    return [];
  }
}

// Save cart to localStorage
function saveCart(cart) {
  try {
    localStorage.setItem("sate_taipan_cart", JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    // Fallback to sessionStorage
    try {
      sessionStorage.setItem("sate_taipan_cart", JSON.stringify(cart));
    } catch (sessionError) {
      console.error('Error saving to sessionStorage:', sessionError);
      // Last resort: memory storage
      window._tempCart = cart;
    }
  }
  updateCartCount();
}

// Update cart count in navbar
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const cartCountElement = document.querySelector(".cart-count");

  if (cartCountElement) {
    cartCountElement.textContent = count;
    cartCountElement.style.display = count > 0 ? "block" : "none";
  }
}

// Format price as Rupiah
function formatRupiah(amount) {
  return "Rp " + amount.toLocaleString("id-ID");
}

// Escape a string for safe insertion into HTML, neutralizing any markup the
// value might contain (e.g. user-entered review text).
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

// Show toast notification
function showToast(title, message, type = "success") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = "toast";

  const iconClass =
    type === "success" ? "fa-check" :
    type === "error" ? "fa-exclamation-circle" :
    "fa-info-circle";

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${iconClass}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Force browser to recognize the element before animation
  void toast.offsetWidth;

  // Show toast immediately
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Auto remove after 3 seconds (reduced from 5 seconds)
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300); // Match the transition duration
  }, 3000);
}

// Save order to localStorage
function placeOrder(cart) {
  // Get existing orders
  const orders = JSON.parse(
    localStorage.getItem("sate_taipan_orders") || "[]"
  );

  // Create new order
  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    items: cart,
    total: cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
    status: "completed",
  };

  // Add to order history
  orders.push(order);

  // Save back to localStorage
  localStorage.setItem("sate_taipan_orders", JSON.stringify(orders));

  // Clear cart
  localStorage.removeItem("sate_taipan_cart");
  updateCartCount();

  return order.id;
}

// Create sample order for demo purposes
function createSampleOrder(products) {
  if (!localStorage.getItem("sate_taipan_orders")) {
    const sampleOrder = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: products.map((product) => ({ ...product, quantity: 1 })),
      total: products.reduce((sum, product) => sum + product.price, 0),
      status: "completed",
    };

    localStorage.setItem(
      "sate_taipan_orders",
      JSON.stringify([sampleOrder])
    );
    console.log("Sample order created for demo purposes.");
  }
}

// Check if user has purchased a product
function hasUserPurchasedProduct(productId) {
  // Get purchase history from localStorage
  const orderHistory = JSON.parse(
    localStorage.getItem("sate_taipan_orders") || "[]"
  );

  // Check if the product exists in any completed order
  return orderHistory.some((order) => {
    return order.items.some((item) => item.id === productId);
  });
}

// Export all utility functions
export {
  getCart,
  saveCart,
  updateCartCount,
  formatRupiah,
  escapeHtml,
  showToast,
  placeOrder,
  createSampleOrder,
  hasUserPurchasedProduct
};