/**
 * optimized-cart-stock.js - High performance cart and stock management
 * Improves responsiveness by batching operations and using memory cache
 */

// ===== CACHING SYSTEM =====
// In-memory caches to minimize localStorage reads/writes
let stockCache = null;
let cartCache = null;
let lastOpTime = Date.now();
let pendingStockUpdate = false;
let pendingCartUpdate = false;

// Constants
const STOCK_KEY = "sate_taipan_stock";
const STOCK_TIMESTAMP_KEY = "sate_taipan_stock_timestamp";
const CART_KEY = "sate_taipan_cart";
const MAX_STOCK = 15;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ===== CART FUNCTIONS =====

// Fast cart retrieval using cache
function getCart() {
  if (cartCache !== null) {
    return cartCache;
  }

  try {
    const cartData = localStorage.getItem(CART_KEY);
    cartCache = cartData ? JSON.parse(cartData) : [];
    return cartCache;
  } catch (e) {
    console.error("Error loading cart data:", e);
    cartCache = [];
    return cartCache;
  }
}

// Efficient cart updates with debounced storage
function saveCart(cart) {
  cartCache = cart;

  if (!pendingCartUpdate) {
    pendingCartUpdate = true;

    setTimeout(() => {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cartCache));
        updateCartCount();
      } catch (e) {
        console.error("Error saving cart:", e);
      }
      pendingCartUpdate = false;
    }, 50); // Short delay for batching
  }
}

// Optimized add to cart that checks stock in a single operation
function addToCart(product, sauces = []) {
  // Calculate sauce price
  const saucePrice = sauces.reduce((total, sauce) => {
    return total + (sauce === "original" ? 0 : 1000);
  }, 0);

  const totalPrice = product.price + saucePrice;
  const cart = getCart();

  // Check stock first - prevents double-checking operations
  if (!checkAndDecreaseStock(product.id)) {
    return false;
  }

  // Find existing items with same customization
  const existingItemIndex = cart.findIndex((item) => {
    if (item.id !== product.id) return false;

    if (!item.sauces?.length && !sauces.length) return true;

    if (
      !item.sauces?.length ||
      !sauces.length ||
      item.sauces.length !== sauces.length
    )
      return false;

    const itemSaucesSorted = [...item.sauces].sort();
    const newSaucesSorted = [...sauces].sort();
    return itemSaucesSorted.every(
      (sauce, idx) => sauce === newSaucesSorted[idx]
    );
  });

  // Update cart efficiently
  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity++;
    saveCart(cart);
    showToast(
      "Cart Updated",
      `${product.name} quantity increased to ${cart[existingItemIndex].quantity}`
    );
  } else {
    const sauceDetails = sauces.map((sauce) => ({
      name: sauce,
      price: sauce === "original" ? 0 : 1000,
    }));

    cart.push({
      ...product,
      sauces: sauces,
      price: totalPrice,
      originalPrice: product.price,
      quantity: 1,
      sauceDetails: sauceDetails,
    });

    saveCart(cart);
    showToast("Added to Cart", `${product.name} has been added to your cart`);
  }

  return true;
}

// ===== STOCK FUNCTIONS =====

// Get stock data with caching
function getStockData() {
  if (stockCache !== null) {
    return stockCache;
  }

  checkStockReset();

  try {
    const stockData = localStorage.getItem(STOCK_KEY);
    if (!stockData) {
      stockCache = initializeStock();
      return stockCache;
    }

    stockCache = JSON.parse(stockData);
    return stockCache;
  } catch (e) {
    console.error("Error loading stock data:", e);
    stockCache = initializeStock();
    return stockCache;
  }
}

// Initialize stock for all products
function initializeStock() {
  const stockData = {};
  const products = window.products || [];

  products.forEach((product) => {
    stockData[product.id] = MAX_STOCK;
  });

  localStorage.setItem(STOCK_TIMESTAMP_KEY, Date.now().toString());
  localStorage.setItem(STOCK_KEY, JSON.stringify(stockData));

  return stockData;
}

// Check if stock needs to be reset (once every 24 hours)
function checkStockReset() {
  try {
    const lastTimestamp = localStorage.getItem(STOCK_TIMESTAMP_KEY);

    if (!lastTimestamp) {
      return initializeStock();
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - parseInt(lastTimestamp);

    if (timeDiff >= RESET_INTERVAL) {
      console.log("Resetting product stock (24 hour period)");
      localStorage.setItem(STOCK_TIMESTAMP_KEY, currentTime.toString());
      stockCache = initializeStock();
      return true;
    }
  } catch (e) {
    console.error("Error checking stock reset:", e);
  }

  return false;
}

// Single efficient function that checks and updates stock in one operation
function checkAndDecreaseStock(productId) {
  const stockData = getStockData();

  if (stockData[productId] === undefined) {
    stockData[productId] = MAX_STOCK;
  }

  // Out of stock
  if (stockData[productId] <= 0) {
    showToast(
      "Out of Stock",
      "Sorry, this item is currently out of stock",
      "error"
    );
    return false;
  }

  // Decrease stock and save
  stockData[productId]--;
  stockCache = stockData;

  // Schedule a stock display update
  scheduleStockUpdate(productId);

  // Save to localStorage - but debounced
  if (!pendingStockUpdate) {
    pendingStockUpdate = true;
    setTimeout(() => {
      try {
        localStorage.setItem(STOCK_KEY, JSON.stringify(stockCache));
      } catch (e) {
        console.error("Error saving stock data:", e);
      }
      pendingStockUpdate = false;
    }, 100);
  }

  return true;
}

// Get remaining stock for a product
function getRemainingStock(productId) {
  const stockData = getStockData();
  return stockData[productId] !== undefined ? stockData[productId] : MAX_STOCK;
}

// ===== UI FUNCTIONS =====

// Update cart count indicator in a performance-friendly way
function updateCartCount() {
  const cart = cartCache || getCart();
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const cartCountElement = document.querySelector(".cart-count");

  if (cartCountElement) {
    cartCountElement.textContent = count;
    cartCountElement.style.display = count > 0 ? "block" : "none";
  }
}

// Show toast notification
function showToast(title, message, type = "success") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconClass =
    type === "success"
      ? "fa-check"
      : type === "error"
      ? "fa-exclamation-circle"
      : "fa-info-circle";

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${iconClass}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Show toast with requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  });

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Schedule stock display update using requestAnimationFrame
let stockUpdateScheduled = false;
let pendingStockUpdates = new Set();

function scheduleStockUpdate(productId) {
  pendingStockUpdates.add(productId);

  if (!stockUpdateScheduled) {
    stockUpdateScheduled = true;

    requestAnimationFrame(() => {
      const productIds = Array.from(pendingStockUpdates);
      pendingStockUpdates.clear();
      stockUpdateScheduled = false;

      productIds.forEach((id) => {
        updateProductStockDisplay(id);
      });
    });
  }
}

// Update stock display for a product
function updateProductStockDisplay(productId) {
  const remaining = getRemainingStock(productId);
  const productCards = document.querySelectorAll(
    `.product-card[data-id="${productId}"]`
  );

  productCards.forEach((card) => {
    let stockIndicator = card.querySelector(".stock-indicator");

    if (!stockIndicator && (remaining <= 5 || remaining <= 0)) {
      stockIndicator = document.createElement("div");
      stockIndicator.className = "stock-indicator";
      const imageContainer = card.querySelector(".product-image-container");
      if (imageContainer) {
        imageContainer.appendChild(stockIndicator);
      }
    }

    if (stockIndicator) {
      if (remaining <= 0) {
        stockIndicator.className = "stock-indicator out-of-stock";
        stockIndicator.textContent = "Sold Out";
        card.classList.add("out-of-stock");

        const addButton = card.querySelector(".add-to-cart");
        if (addButton) {
          addButton.disabled = true;
          addButton.innerHTML = '<i class="fas fa-times"></i> Sold Out';
        }
      } else if (remaining <= 3) {
        stockIndicator.className = "stock-indicator low-stock critical";
        stockIndicator.textContent = `Only ${remaining} left!`;
        card.classList.remove("out-of-stock");
      } else if (remaining <= 5) {
        stockIndicator.className = "stock-indicator low-stock";
        stockIndicator.textContent = `Low Stock: ${remaining}`;
        card.classList.remove("out-of-stock");
      } else if (stockIndicator.parentNode) {
        stockIndicator.remove();
      }
    }
  });
}

// Initialize stock displays for all products
function initializeStockDisplays() {
  const products = window.products || [];

  requestAnimationFrame(() => {
    products.forEach((product) => {
      updateProductStockDisplay(product.id);
    });
  });
}

// ===== INITIALIZATION =====
// Initialize by preloading stock and cart data
function initialize() {
  // Pre-load data into cache
  getStockData();
  getCart();

  // Initialize stock displays
  initializeStockDisplays();

  // Set interval to refresh stock displays occasionally
  setInterval(initializeStockDisplays, 5000);

  console.log("Optimized cart and stock system initialized");
}

// Run initialization when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

// Export functions for use in other modules - FIX: added missing function exports
window.addToCart = addToCart;
window.getCart = getCart;
window.saveCart = saveCart;
window.getStockData = getStockData;
window.getRemainingStock = getRemainingStock;
window.showToast = showToast;
window.updateCartCount = updateCartCount;
// FIX: Add these missing exports that other files might need
window.initializeStock = initializeStock; // Added for error-recovery.js
window.checkAndDecreaseStock = checkAndDecreaseStock;
window.updateProductStockDisplay = updateProductStockDisplay;
window.initializeStockDisplays = initializeStockDisplays;