/**
 * stock-worker.js - Web worker for stock management
 * Processes stock operations in a separate thread
 */

// This is a Web Worker file to be loaded by a Worker constructor

// Handle messages from the main thread
self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === "checkStock") {
    // Process stock operations here
    const result = processStockCheck(data);
    self.postMessage({ type: "stockResult", result });
  }
};

// Internal function for processing stock checks
function processStockCheck(data) {
  const { productId, quantity, availableStock } = data;
  
  // Simple stock validation
  const isAvailable = availableStock && availableStock[productId] && 
                      availableStock[productId] >= quantity;
  
  const remaining = isAvailable ? 
                    availableStock[productId] - quantity : 
                    0;
  
  return {
    productId,
    quantity,
    isAvailable,
    remaining,
    status: isAvailable ? 
            (remaining <= 3 ? "low" : "available") : 
            "unavailable"
  };
}