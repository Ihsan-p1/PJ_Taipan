/**
 * Product stock management functionality
 * Handles stock limits, display, and validation
 */

// Enhance product objects with stock information
function enhanceProductsWithStock(products) {
  if (!products || !Array.isArray(products)) return products;

  // Example stock data - in a real app, this would come from a database
  const stockData = {
    1: { total: 50, remaining: 23 }, // Sate Taipan Original
    2: { total: 40, remaining: 5 }, // Sate Taipan Moza (low stock)
    3: { total: 35, remaining: 0 }, // Sate Taipan Telur (out of stock)
    4: { total: 100, remaining: 78 }, // Teh Jasmine
    5: { total: 100, remaining: 62 }, // Teh Chamomile
    6: { total: 80, remaining: 27 }, // Teh Lavender
    7: { total: 70, remaining: 12 }, // Teh Bunga Telang
  };

  // Add stock data to each product
  return products.map((product) => {
    const stock = stockData[product.id] || { total: 50, remaining: 50 };
    return {
      ...product,
      stock: {
        ...stock,
        percentage: Math.round((stock.remaining / stock.total) * 100),
        status: getStockStatus(stock.remaining, stock.total),
      },
    };
  });
}

// Get stock status based on remaining quantity
function getStockStatus(remaining, total) {
  if (remaining <= 0) return "out-of-stock";

  const percentage = (remaining / total) * 100;

  if (percentage <= 10) return "critical";
  if (percentage <= 25) return "low";
  if (percentage <= 50) return "medium";
  return "high";
}

// Update product rendering to include stock information
function renderProductWithStock(product, container) {
  // Stock indicator to add to product card
  let stockIndicator = "";
  let stockCountDisplay = "";
  let stockProgressBar = "";
  let soldOutOverlay = "";

  // Create stock indicator based on status
  if (product.stock) {
    const { remaining, status, percentage } = product.stock;

    // Progress bar
    stockProgressBar = `
      <div class="stock-progress-container">
        <div class="stock-progress-bar ${status}" style="width: ${percentage}%"></div>
      </div>
    `;

    // Stock count display
    if (status === "out-of-stock") {
      stockCountDisplay = `
        <div class="stock-count none">
          <i class="fas fa-times-circle"></i> Out of stock today
        </div>
      `;

      // Add sold out overlay
      soldOutOverlay = `
        <div class="sold-out-overlay">
          <div class="sold-out-message">Sold Out</div>
        </div>
      `;
    } else if (status === "critical" || status === "low") {
      stockCountDisplay = `
        <div class="stock-count low">
          <i class="fas fa-exclamation-circle"></i> Only ${remaining} left today
        </div>
      `;
    } else {
      stockCountDisplay = `
        <div class="stock-count">
          <i class="fas fa-check-circle"></i> ${remaining} available today
        </div>
      `;
    }

    // Stock badge
    if (status === "out-of-stock") {
      stockIndicator = `<div class="stock-indicator out-of-stock">Sold Out</div>`;
    } else if (status === "critical") {
      stockIndicator = `<div class="stock-indicator low-stock critical">Almost Gone</div>`;
    } else if (status === "low") {
      stockIndicator = `<div class="stock-indicator low-stock">Low Stock</div>`;
    }
  }

  // Determine if product is out of stock
  const isOutOfStock = product.stock && product.stock.status === "out-of-stock";

  // Card class
  const cardClass = `product-card ${isOutOfStock ? "out-of-stock" : ""}`;

  // Create product card HTML including stock information
  const productCard = `
    <div class="${cardClass}" data-id="${product.id}">
      <div class="product-image-container">
        <img src="${product.image}" class="product-image" alt="${product.name}" 
          onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(
            product.name
          )}'">
        <div class="product-category-tag">${product.category}</div>
        ${stockIndicator}
        ${soldOutOverlay}
      </div>
      <div class="product-details">
        <h5 class="product-name">${product.name}</h5>
        <div class="product-description">${
          product.description ||
          "Delicious Indonesian satay made with fresh ingredients."
        }</div>
        ${stockCountDisplay}
        ${stockProgressBar}
        <p class="product-price">${formatPrice(product.price)}</p>
        <div class="product-actions">
          <button class="add-to-cart" data-id="${product.id}" ${
    isOutOfStock ? "disabled" : ""
  }>
            <i class="fas fa-cart-plus"></i> ${
              isOutOfStock ? "Sold Out" : "Add to Cart"
            }
          </button>
          <button class="rate-product" data-id="${product.id}" data-name="${
    product.name
  }">
            <i class="fas fa-star"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  // Add to container
  if (container) {
    container.innerHTML += productCard;
  }

  return productCard;
}

// Format price helper (to be used with product rendering)
function formatPrice(price) {
  return "Rp " + price.toLocaleString("id-ID");
}

// Validate stock before adding to cart
function validateStockBeforeAddToCart(productId, quantity = 1) {
  // Find product stock information
  const products = window.enhancedProducts || [];
  const product = products.find((p) => p.id === parseInt(productId));

  if (!product || !product.stock) {
    console.warn("Product or stock information not found");
    return { valid: false, message: "Product information not available" };
  }

  // Check if out of stock
  if (product.stock.remaining <= 0) {
    return {
      valid: false,
      message: "This product is sold out for today",
    };
  }

  // Check if there's enough stock
  if (quantity > product.stock.remaining) {
    return {
      valid: false,
      message: `Sorry, only ${product.stock.remaining} left in stock`,
    };
  }

  // Stock is valid
  return { valid: true };
}

// Initialize stock management
function initStockManagement() {
  // Get products from global scope if available
  const products = window.products || [];

  // Enhance products with stock information
  window.enhancedProducts = enhanceProductsWithStock(products);

  // Hook into cart add functionality
  const originalAddToCart = window.addToCart;

  // Override addToCart function if it exists
  if (typeof originalAddToCart === "function") {
    window.addToCart = function (product, sauces = [], quantity = 1) {
      // Validate stock first
      const validation = validateStockBeforeAddToCart(product.id, quantity);

      if (!validation.valid) {
        // Show error message
        if (window.showToast) {
          window.showToast("Stock Limit", validation.message, "error");
        } else {
          alert(validation.message);
        }
        return false;
      }

      // Call original function
      return originalAddToCart(product, sauces, quantity);
    };
  }
}

// Export functions
window.enhanceProductsWithStock = enhanceProductsWithStock;
window.renderProductWithStock = renderProductWithStock;
window.validateStockBeforeAddToCart = validateStockBeforeAddToCart;
window.initStockManagement = initStockManagement;

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", function () {
  initStockManagement();
});
