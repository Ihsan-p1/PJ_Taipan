/**
 * stock-controller.js - Main thread controller for stock operations
 * Handles communication with stock-worker.js
 */

// Stock controller singleton
let stockWorkerInstance = null;

/**
 * Initialize the stock worker
 * @returns {Object} Stock controller interface
 */
export function initStockWorker() {
  if (stockWorkerInstance) {
    return stockWorkerInstance;
  }

  try {
    // Try to create Web Worker
    const worker = new Worker("js/stock-worker.js");

    // Container for callbacks
    const callbacks = {};

    // Message handler from worker
    worker.onmessage = function (e) {
      const { type, result } = e.data;

      if (type === "stockResult") {
        // Find and call the corresponding callback
        const callbackId = result.productId;
        if (callbacks[callbackId]) {
          callbacks[callbackId](result);
          // One-time callback, remove after calling
          delete callbacks[callbackId];
        }

        // Also dispatch an event for other components that might be listening
        document.dispatchEvent(
          new CustomEvent("stockUpdate", {
            detail: result,
          })
        );
      }
    };

    // Error handler
    worker.onerror = function (error) {
      console.error("Stock worker error:", error);
      document.dispatchEvent(
        new CustomEvent("stockError", {
          detail: error,
        })
      );
    };

    // Create the controller interface
    stockWorkerInstance = {
      /**
       * Check stock availability for a product
       * @param {number} productId - Product ID
       * @param {number} quantity - Quantity to check
       * @param {Function} callback - Callback function for result
       */
      checkStock: function (productId, quantity = 1, callback = null) {
        try {
          // Get current stock data from localStorage or window
          const availableStock = window.getStockData
            ? window.getStockData()
            : JSON.parse(localStorage.getItem("sate_taipan_stock") || "{}");

          // Store callback if provided
          if (callback && typeof callback === "function") {
            callbacks[productId] = callback;
          }

          // Send message to worker
          worker.postMessage({
            type: "checkStock",
            data: {
              productId,
              quantity,
              availableStock,
            },
          });
        } catch (error) {
          console.error("Error checking stock:", error);
          // Fallback to direct calculation if worker communication fails
          const result = checkStockDirectly(productId, quantity);

          if (callback && typeof callback === "function") {
            callback(result);
          }
        }
      },

      /**
       * Terminate the worker
       */
      terminate: function () {
        worker.terminate();
        stockWorkerInstance = null;
      },
    };

    return stockWorkerInstance;
  } catch (error) {
    console.warn("Web Workers not supported, using fallback:", error);

    // Fallback for browsers that don't support Web Workers
    stockWorkerInstance = {
      checkStock: function (productId, quantity = 1, callback = null) {
        const result = checkStockDirectly(productId, quantity);

        if (callback && typeof callback === "function") {
          setTimeout(() => callback(result), 0);
        }

        // Dispatch event for consistency with worker version
        setTimeout(() => {
          document.dispatchEvent(
            new CustomEvent("stockUpdate", {
              detail: result,
            })
          );
        }, 0);
      },

      terminate: function () {
        stockWorkerInstance = null;
      },
    };

    return stockWorkerInstance;
  }
}

/**
 * Fallback function to check stock directly without a worker
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity to check
 * @returns {Object} Stock check result
 */
function checkStockDirectly(productId, quantity = 1) {
  try {
    // Get stock data
    const availableStock = window.getStockData
      ? window.getStockData()
      : JSON.parse(localStorage.getItem("sate_taipan_stock") || "{}");

    // Check availability
    const isAvailable =
      availableStock &&
      availableStock[productId] &&
      availableStock[productId] >= quantity;

    const remaining = isAvailable ? availableStock[productId] - quantity : 0;

    return {
      productId,
      quantity,
      isAvailable,
      remaining,
      status: isAvailable
        ? remaining <= 3
          ? "low"
          : "available"
        : "unavailable",
    };
  } catch (error) {
    console.error("Error in direct stock check:", error);
    return {
      productId,
      quantity,
      isAvailable: false,
      remaining: 0,
      status: "error",
      error: error.message,
    };
  }
}

// Export a simpler synchronous function for direct usage
export function checkStockAvailability(productId, quantity = 1) {
  return checkStockDirectly(productId, quantity);
}

// Initialize the worker if needed
export function initializeStockSystem() {
  if (!stockWorkerInstance) {
    stockWorkerInstance = initStockWorker();
  }
  return stockWorkerInstance;
}
