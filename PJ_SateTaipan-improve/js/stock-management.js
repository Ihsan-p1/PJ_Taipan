/**
 * stock-management.js - Unified stock management solution
 * Manages product stock levels and updates UI accordingly
 */

// Constants
const STOCK_KEY = "sate_taipan_stock";
const STOCK_TIMESTAMP_KEY = "sate_taipan_stock_timestamp";
const MAX_STOCK = 15;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache for stock data
let stockCache = null;
let pendingStockUpdate = false;
let stockUpdateElements = new Set();

// Add a lock mechanism to prevent race conditions
const stockLocks = new Map();

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

  // Set initial stock values
  products.forEach((product) => {
    // Food items have less stock than drinks for more interesting display
    const defaultStock = product.category === "Food" ? MAX_STOCK : MAX_STOCK * 2;
    
    // Create some variation to make the stock indicators more visible
    let stock;
    if (product.id === 1) {
      stock = 4; // Low stock for demo purposes
    } else if (product.id === 3) {
      stock = 0; // Out of stock for demo purposes
    } else {
      stock = defaultStock;
    }
    
    stockData[product.id] = stock;
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

// Save stock data to storage
function saveStockData(stockData) {
  stockCache = stockData;

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
}

// Check and decrease stock in one operation
function checkAndDecreaseStock(productId) {
  if (stockLocks.get(productId)) {
    console.log('Stock operation in progress');
    return false;
  }
  
  try {
    stockLocks.set(productId, true);
    const stockData = getStockData();
    
    if (stockData[productId] === undefined) {
      stockData[productId] = MAX_STOCK;
    }

    if (stockData[productId] <= 0) {
      if (window.showToast) {
        window.showToast("Out of Stock", "Sorry, this item is currently out of stock", "error");
      }
      return false;
    }

    stockData[productId]--;
    saveStockData(stockData);
    
    // Schedule a stock display update
    scheduleStockUpdate(productId);
    
    return true;
  } catch (error) {
    console.error("Error in checkAndDecreaseStock:", error);
    return false;
  } finally {
    stockLocks.delete(productId);
  }
}

// Schedule stock display update using requestAnimationFrame for performance
let stockUpdateScheduled = false;
function scheduleStockUpdate(productId) {
  stockUpdateElements.add(productId);
  
  if (!stockUpdateScheduled) {
    stockUpdateScheduled = true;

    requestAnimationFrame(() => {
      const productIds = Array.from(stockUpdateElements);
      stockUpdateElements.clear();
      stockUpdateScheduled = false;
      
      // Import updateProductStockDisplay if available
      if (typeof window.updateProductStockDisplay === 'function') {
        productIds.forEach(id => {
          window.updateProductStockDisplay(id);
        });
      } else if (typeof updateProductStockDisplay === 'function') {
        productIds.forEach(id => {
          updateProductStockDisplay(id);
        });
      }
    });
  }
}

// Get remaining stock for a product
function getRemainingStock(productId) {
  const stockData = getStockData();
  return stockData[productId] !== undefined ? stockData[productId] : MAX_STOCK;
}

// Override addToCart function to check stock first
function overrideAddToCart(originalAddToCart) {
  if (typeof originalAddToCart !== 'function') return;
  
  return function(product, sauces = []) {
    // Check stock first - fast and non-interruptive
    if (!checkAndDecreaseStock(product.id)) {
      return false;
    }
    
    // If stock is sufficient, proceed with original operation
    return originalAddToCart(product, sauces);
  };
}

// Override addBundleToCart function with stock checking
function overrideAddBundleToCart(originalAddBundleToCart) {
  if (typeof originalAddBundleToCart !== 'function') return;
  
  return function(bundleType, bundles, products) {
    if (!bundles || !bundleType || !bundles[bundleType]) {
      console.error("Invalid bundle information");
      return false;
    }
    
    const bundle = bundles[bundleType];
    
    // Check stock for all items in the bundle first
    let sufficientStock = true;
    const stockNeeded = {};
    const allProducts = products || window.products || [];
    
    bundle.items.forEach((item) => {
      const product = allProducts.find((p) => p.name === item.name);
      if (product) {
        if (!stockNeeded[product.id]) stockNeeded[product.id] = 0;
        stockNeeded[product.id] += item.quantity;
        
        const remaining = getRemainingStock(product.id);
        if (remaining < stockNeeded[product.id]) {
          sufficientStock = false;
          if (window.showToast) {
            window.showToast(
              "Bundle Unavailable",
              `Not enough ${product.name} in stock for this bundle`,
              "error"
            );
          }
        }
      }
    });
    
    if (!sufficientStock) return false;
    
    // Decrease stock for all items
    const stockData = getStockData();
    Object.keys(stockNeeded).forEach(productId => {
      const numericId = parseInt(productId);
      stockData[numericId] = (stockData[numericId] || MAX_STOCK) - stockNeeded[productId];
      scheduleStockUpdate(numericId);
    });
    
    // Save updated stock data
    saveStockData(stockData);
    
    // If stock is sufficient, proceed with original operation
    return originalAddBundleToCart(bundleType);
  };
}

// Update stock display for all products
function updateAllProductStockDisplays() {
  const products = window.products || [];
  products.forEach(product => {
    if (typeof window.updateProductStockDisplay === 'function') {
      window.updateProductStockDisplay(product.id);
    } else if (typeof updateProductStockDisplay === 'function') {
      updateProductStockDisplay(product.id);
    }
  });
}

// Initialize stock management
function initStockManagement() {
  console.log("Initializing stock management...");
  
  // Pre-load stock data to cache
  getStockData();
  
  // Override addToCart with stock-checking version if available
  if (window.addToCart) {
    const originalAddToCart = window.addToCart;
    window.addToCart = overrideAddToCart(originalAddToCart);
    console.log("Stock-checking addToCart function installed");
  }
  
  // Override addBundleToCart if available
  if (window.addBundleToCart) {
    const originalAddBundleToCart = window.addBundleToCart;
    window.addBundleToCart = overrideAddBundleToCart(originalAddBundleToCart);
    console.log("Stock-checking addBundleToCart function installed");
  }
  
  // Update stock displays for all products
  setTimeout(() => {
    updateAllProductStockDisplays();
  }, 500);
  
  console.log("Stock management initialized successfully");
}

// Run initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStockManagement);
  } else {
    initStockManagement();
  }
});

// Make functions available globally
window.getStockData = getStockData;
window.getRemainingStock = getRemainingStock;
window.checkAndDecreaseStock = checkAndDecreaseStock;
window.initStockManagement = initStockManagement;

// Export functions for module usage
export {
  getStockData,
  getRemainingStock,
  checkAndDecreaseStock,
  initStockManagement
};