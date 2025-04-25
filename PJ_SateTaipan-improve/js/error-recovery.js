/**
 * error-recovery.js
 * Provides mechanisms for recovering from errors in the application
 */

// Add system to recover from errors
const errorRecovery = {
  retryCount: 0,
  maxRetries: 3,

  async retryOperation(operation, ...args) {
    try {
      return await operation(...args);
    } catch (error) {
      console.error("Operation failed:", error);

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(
          `Retrying operation (${this.retryCount}/${this.maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.retryOperation(operation, ...args);
      }

      // If all retries fail, try to recover
      return this.recoverFromError(error);
    }
  },

  recoverFromError(error) {
    console.log("Attempting to recover from error");

    try {
      // Clear potentially corrupted data
      localStorage.removeItem("sate_taipan_cart");
      localStorage.removeItem("sate_taipan_stock");

      // Reset stock and cart using available functions
      // FIX: Use getStockData instead of initializeStock
      if (window.getStockData) {
        // This will initialize stock if needed
        window.getStockData();
        console.log("Reset stock data using getStockData");
      } else {
        // Manual reset of stock as fallback
        try {
          const MAX_STOCK = 15; // Default max stock value
          const products = window.products || [];
          const stockData = {};
          
          products.forEach(product => {
            stockData[product.id] = MAX_STOCK;
          });
          
          localStorage.setItem("sate_taipan_stock_timestamp", Date.now().toString());
          localStorage.setItem("sate_taipan_stock", JSON.stringify(stockData));
          console.log("Manually reset stock data");
        } catch (e) {
          console.error("Failed to manually reset stock:", e);
        }
      }
      
      // Reset cart
      if (window.saveCart) {
        window.saveCart([]);
        console.log("Reset cart using saveCart");
      } else {
        // Fallback: try to set empty cart directly
        try {
          localStorage.setItem("sate_taipan_cart", "[]");
          console.log("Reset cart using direct localStorage");
        } catch (e) {
          console.error("Failed to reset cart:", e);
        }
      }

      console.log("Recovery complete, refreshing page");
      // Refresh the page as last resort
      window.location.reload();
      
      return { recovered: true };
    } catch (recoveryError) {
      console.error("Recovery failed:", recoveryError);
      return { recovered: false, error: recoveryError };
    }
  },
};

// Make sure the error recovery object is globally available
window.errorRecovery = errorRecovery;

// Export for module usage
export default errorRecovery;