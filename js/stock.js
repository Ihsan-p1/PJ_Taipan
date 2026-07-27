/**
 * stock.js — Single stock service.
 *
 * Replaces the five overlapping stock scripts that used to exist
 * (stock-management, optimized-cart-stock, product-stock, stock-controller,
 * stock-worker). One module owns reading, decrementing, and rendering stock.
 *
 * Stock lives in localStorage and resets to full every 24 hours so the demo
 * always has something to show.
 */

import { products } from "./data/products.js";
import { showToast } from "./utils.js";

const STOCK_KEY = "sate_taipan_stock";
const STOCK_TIMESTAMP_KEY = "sate_taipan_stock_timestamp";
const MAX_STOCK = 15;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache to avoid re-reading localStorage on every lookup.
let stockCache = null;
let saveScheduled = false;

// Seed values chosen so the storefront shows off every stock state:
// a low-stock warning (id 1) and a sold-out item (id 3).
const DEMO_STOCK = { 1: 4, 3: 0 };

function buildInitialStock() {
  const data = {};
  products.forEach((product) => {
    const fallback = product.category === "Food" ? MAX_STOCK : MAX_STOCK * 2;
    data[product.id] = DEMO_STOCK[product.id] ?? fallback;
  });
  return data;
}

// Save the current stock levels. Note this does NOT touch the reset
// timestamp — otherwise every add-to-cart would postpone the 24h reseed
// indefinitely (the timestamp must mark the last *reseed*, not the last write).
function persist(data) {
  try {
    localStorage.setItem(STOCK_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Could not save stock data:", error);
  }
}

// Reseed stock to full and stamp the reset time.
function seedStock() {
  stockCache = buildInitialStock();
  try {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stockCache));
    localStorage.setItem(STOCK_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Could not seed stock data:", error);
  }
  return stockCache;
}

function needsReset() {
  const last = localStorage.getItem(STOCK_TIMESTAMP_KEY);
  if (!last) return true;
  return Date.now() - parseInt(last, 10) >= RESET_INTERVAL;
}

function getStockData() {
  if (stockCache) return stockCache;

  try {
    if (needsReset()) {
      return seedStock();
    }
    const raw = localStorage.getItem(STOCK_KEY);
    stockCache = raw ? JSON.parse(raw) : seedStock();
  } catch (error) {
    console.error("Could not read stock data, reinitializing:", error);
    return seedStock();
  }
  return stockCache;
}

// Debounced write so rapid add-to-cart clicks don't thrash localStorage.
function scheduleSave() {
  if (saveScheduled) return;
  saveScheduled = true;
  setTimeout(() => {
    persist(stockCache);
    saveScheduled = false;
  }, 100);
}

/** Remaining stock for a product (defaults to MAX_STOCK if unknown). */
export function getRemainingStock(productId) {
  const data = getStockData();
  return data[productId] !== undefined ? data[productId] : MAX_STOCK;
}

/**
 * Decrement stock for one unit if available.
 * @returns {boolean} true when the item was in stock and has been decremented.
 */
export function checkAndDecreaseStock(productId) {
  const data = getStockData();
  if (data[productId] === undefined) data[productId] = MAX_STOCK;

  if (data[productId] <= 0) {
    showToast("Out of Stock", "Sorry, this item is currently out of stock", "error");
    return false;
  }

  data[productId] -= 1;
  scheduleSave();
  updateProductStockDisplay(productId);
  return true;
}

/**
 * Reserve stock for every item in a bundle atomically.
 * @param {Array<{id:number, quantity:number}>} items
 * @returns {boolean} true when the whole bundle fit in stock.
 */
export function checkAndDecreaseBundleStock(items) {
  const data = getStockData();
  const needed = {};
  for (const { id, quantity } of items) {
    needed[id] = (needed[id] || 0) + quantity;
    if (getRemainingStock(id) < needed[id]) {
      showToast("Bundle Unavailable", "Not enough stock for this bundle", "error");
      return false;
    }
  }
  Object.entries(needed).forEach(([id, qty]) => {
    data[id] = (data[id] ?? MAX_STOCK) - qty;
    updateProductStockDisplay(Number(id));
  });
  scheduleSave();
  return true;
}

/**
 * Reserve `qty` units of a product if enough are in stock.
 * @returns {boolean} true when the whole quantity was available and reserved.
 */
export function reserveStock(productId, qty = 1) {
  const data = getStockData();
  if (data[productId] === undefined) data[productId] = MAX_STOCK;

  if (data[productId] < qty) {
    showToast("Not Enough Stock", "There isn't enough stock for that quantity", "error");
    return false;
  }

  data[productId] -= qty;
  scheduleSave();
  updateProductStockDisplay(productId);
  return true;
}

/**
 * Return `qty` units to stock — used when items are removed or their cart
 * quantity is reduced, so reserved stock is not leaked until the 24h reset.
 */
export function increaseStock(productId, qty = 1) {
  const data = getStockData();
  const current = data[productId] ?? 0;
  data[productId] = Math.max(0, current + qty);
  scheduleSave();
  updateProductStockDisplay(productId);
}

/** Update the stock badge / sold-out state on a rendered product card. */
export function updateProductStockDisplay(productId) {
  const remaining = getRemainingStock(productId);
  document
    .querySelectorAll(`.product-card[data-id="${productId}"]`)
    .forEach((card) => {
      const imageContainer = card.querySelector(".product-image-container");
      let indicator = card.querySelector(".stock-indicator");

      if (!indicator && remaining <= 5 && imageContainer) {
        indicator = document.createElement("div");
        indicator.className = "stock-indicator";
        imageContainer.appendChild(indicator);
      }

      const addButton = card.querySelector(".add-to-cart");

      if (remaining <= 0) {
        card.classList.add("out-of-stock");
        if (indicator) {
          indicator.className = "stock-indicator out-of-stock";
          indicator.textContent = "Sold Out";
        }
        if (addButton) {
          addButton.disabled = true;
          addButton.innerHTML = '<i class="fas fa-times"></i> Sold Out';
        }
      } else {
        card.classList.remove("out-of-stock");
        if (remaining <= 3 && indicator) {
          indicator.className = "stock-indicator low-stock critical";
          indicator.textContent = `Only ${remaining} left!`;
        } else if (remaining <= 5 && indicator) {
          indicator.className = "stock-indicator low-stock";
          indicator.textContent = `Low Stock: ${remaining}`;
        } else if (indicator) {
          indicator.remove();
        }
      }
    });
}

/** Refresh stock badges for every product currently on the page. */
export function refreshAllStockDisplays() {
  products.forEach((product) => updateProductStockDisplay(product.id));
}

/** Preload stock and paint the initial badges. Call once per page. */
export function initStock() {
  getStockData();
  requestAnimationFrame(refreshAllStockDisplays);
}
