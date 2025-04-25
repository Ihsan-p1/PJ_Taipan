// Helper function to create product card
function createProductCard(product) {
  const productCard = document.createElement("div");
  productCard.className = "product-card";
  productCard.dataset.id = product.id;

  // Get stock information
  const remaining = getRemainingStock(product.id);
  const isOutOfStock = remaining <= 0;

  // Get rating display
  let ratingDisplay = "No reviews yet";
  try {
    const { average, count } = getProductRating(product.id);
    if (count > 0) {
      ratingDisplay = `${"★".repeat(Math.round(average))}${"☆".repeat(
        5 - Math.round(average)
      )} (${count} reviews)`;
    }
  } catch (e) {
    console.warn("Error getting product rating:", e);
  }

  // Add stock indicator if needed
  let stockIndicatorHtml = '';
  if (isOutOfStock) {
    stockIndicatorHtml = `<div class="stock-indicator out-of-stock">Sold Out</div>`;
  } else if (remaining <= 3) {
    stockIndicatorHtml = `<div class="stock-indicator low-stock critical">Only ${remaining} left!</div>`;
  } else if (remaining <= 5) {
    stockIndicatorHtml = `<div class="stock-indicator low-stock">Low Stock: ${remaining}</div>`;
  }

  // Create the HTML structure
  productCard.innerHTML = `
    <div class="product-image-container">
      <img src="${product.image}" class="product-image" alt="${product.name}" 
       onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(
         product.name
       )}'">
      <div class="product-category-tag">${product.category}</div>
      ${stockIndicatorHtml}
      ${isOutOfStock ? '<div class="sold-out-overlay"><div class="sold-out-message">Sold Out</div></div>' : ''}
    </div>
    <div class="product-details">
      <h5 class="product-name">${product.name}</h5>
      <div class="rating-display">${ratingDisplay}</div>
      <p class="product-description">${product.description || ""}</p>
      <p class="product-price">${formatRupiah(product.price)}</p>
      <div class="product-actions">
        <button class="add-to-cart" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
          <i class="fas fa-cart-plus me-1"></i> ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
        </button>
        <button class="rate-product" data-id="${product.id}" data-name="${
    product.name
  }">
          <i class="fas fa-star"></i>
        </button>
      </div>
    </div>
  `;

  return productCard;
}

// Attach event listeners to product buttons
function attachProductEventListeners() {
  // Use event delegation for better performance
  const productsContainer = document.getElementById("products");
  if (!productsContainer) return;

  productsContainer.addEventListener("click", async (e) => {
    // Find closest .add-to-cart button if clicked on or within button
    const addButton = e.target.closest(".add-to-cart");
    if (addButton) {
      // Prevent action if button is disabled
      if (addButton.disabled) return;
      
      // Temporarily disable button to prevent double-clicks
      addButton.disabled = true;

      try {
        const productId = parseInt(addButton.dataset.id);
        const product = getProductById(productId);

        if (!product) {
          console.error("Product not found:", productId);
          return;
        }

        if (product.category === "Food") {
          // For food items, open customization modal
          openCustomizationModal(productId);
        } else {
          // For non-food items, add directly to cart
          const success = await addToCart(product, []);
          if (success) {
            showToast("Success", `${product.name} added to cart`);
          }
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        showToast("Error", "Failed to add item to cart", "error");
      } finally {
        // Re-enable the button after a short delay
        setTimeout(() => {
          addButton.disabled = false;
        }, 500);
      }
    }

    // Find closest .rate-product button if clicked on or within button
    const rateButton = e.target.closest(".rate-product");
    if (rateButton) {
      const productId = parseInt(rateButton.dataset.id);
      const productName = rateButton.dataset.name;
      openRatingModal(productId, productName);
    }
  });
}

// Initialize products display with event listeners
function initializeProductDisplay() {
  try {
    console.log("Initializing product display...");

    // First load all products
    loadProducts('all');

    // Add event listeners to category buttons
    document.querySelectorAll(".category-btn").forEach((button) => {
      button.addEventListener("click", function (e) {
        try {
          // Get category from button's data attribute
          const category = this.dataset.category;
          console.log("Category selected:", category);

          if (!category) {
            console.warn("No category specified in button data:", this);
            return;
          }

          // Update active class
          document.querySelectorAll(".category-btn").forEach((btn) => {
            btn.classList.remove("active");
          });
          this.classList.add("active");

          // Load filtered products
          loadProducts(category);
        } catch (error) {
          console.error("Error in category button handler:", error);
        }
      });
    });

    console.log("Product display initialized successfully");
  } catch (error) {
    console.error("Error initializing product display:", error);

    // Emergency fallback - ensure products are loaded even if initialization fails
    loadProducts('all');
  }
}

// Make functions available globally for resilience
window.getProductById = getProductById;
window.getAllProducts = getAllProducts;
window.getProductRating = getProductRating;
window.loadProducts = loadProducts;
window.initializeProductDisplay = initializeProductDisplay;

// Export functions for use in other modules
export {
  products,
  getProductById,
  getAllProducts,
  saveReview,
  getProductRating,
  loadProducts,
  initializeProductDisplay,
  updateProductStockDisplay,
  getRemainingStock
};/**
 * product-display.js - Product rendering and management
 * Handles product display, filtering, and rating functionality
 */

import { formatRupiah, hasUserPurchasedProduct, showToast } from "./utils.js";
import { openCustomizationModal, openRatingModal } from "./modals.js";
import { addToCart } from "./cart-manager.js";

// Product data
const products = [
  {
    id: 1,
    name: "Sate Taipan Original",
    price: 15000,
    category: "Food",
    popular: true,
    image: "images/sate-taichan-ori.jpg",
    description:
      "Simple grilled chicken skewers without peanut sauce. Savory with a spicy kick—clean, bold flavors that hit just right. Perfect for spicy food lovers who like it fuss-free.",
  },
  {
    id: 2,
    name: "Sate Taipan Mozarella",
    price: 17000,
    category: "Food",
    popular: true,
    image: "images/sate-taichan-moza.jpg",
    description:
      "Spicy taichan topped with gooey mozzarella cheese. A creamy, fiery combo that melts beautifully—looks good, tastes even better.",
  },
  {
    id: 3,
    name: "Sate Taipan Telur",
    price: 17000,
    category: "Food",
    image: "images/sate-taichan-telur.jpg",
    description:
      "Delicious chicken satay topped with a perfectly cooked sunny side up egg. A protein-rich option for satay lovers.",
  },
  {
    id: 4,
    name: "Teh Jasmine",
    price: 10000,
    category: "Drink",
    popular: true,
    image: "images/Teh-Jasmine.jpeg",
    description:
      "Light and floral with a soft jasmine aroma. A calming cup that fits any mood—ideal for slow mornings or cozy study nights.",
  },
  {
    id: 5,
    name: "Teh Chamomile",
    price: 10000,
    category: "Drink",
    image: "images/Teh-Chamomile.jpg",
    description:
      "Delicate, caffeine-free floral tea. Helps soothe the mind and support better sleep—gentle, warm, and a little hug in a cup.",
  },
  {
    id: 6,
    name: "Teh Lavender",
    price: 10000,
    category: "Drink",
    image: "images/Teh-Lavender.jpg",
    description:
      "Soft lavender aroma in every sip. Calms the mind and body—perfect for night routines, journaling moments, or winding down after a long day.",
  },
  {
    id: 7,
    name: "Teh Bunga Telang",
    price: 10000,
    category: "Drink",
    image: "images/Teh-Bunga-Telang.jpeg",
    description:
      "Naturally vibrant blue tea with earthy tones and antioxidant benefits. Refreshing and aesthetic—your new go-to herbal drink for wellness and soft vibes.",
  },
];

// Make products globally available for other scripts
window.products = products;

// Get product by ID
function getProductById(productId) {
  return products.find((product) => product.id === productId);
}

// Get all products
function getAllProducts() {
  return products;
}

// Safe version of get product rating
function getProductRating(productId) {
  try {
    const reviews = JSON.parse(
      localStorage.getItem("sate_taipan_reviews") || "{}"
    );

    if (!reviews[productId] || reviews[productId].length === 0) {
      return { average: 0, count: 0 };
    }

    const total = reviews[productId].reduce(
      (sum, review) => sum + review.rating,
      0
    );
    return {
      average: Math.round((total / reviews[productId].length) * 10) / 10,
      count: reviews[productId].length,
    };
  } catch (error) {
    console.error("Error getting product rating:", error);
    return { average: 0, count: 0 };
  }
}

// Save review for a product
function saveReview(productId, name, rating, reviewText) {
  try {
    // Get existing reviews
    const reviews = JSON.parse(
      localStorage.getItem("sate_taipan_reviews") || "{}"
    );

    // If there are no reviews for this product yet, create an array
    if (!reviews[productId]) {
      reviews[productId] = [];
    }

    // Add the new review with timestamp
    reviews[productId].push({
      name,
      rating,
      review: reviewText,
      date: new Date().toISOString(),
      verified: true,
    });

    // Save back to localStorage
    localStorage.setItem("sate_taipan_reviews", JSON.stringify(reviews));

    // Update the product's display
    updateProductRating(productId);
  } catch (error) {
    console.error("Error saving review:", error);
    showToast("Error", "There was a problem saving your review.", "error");
  }
}

// Update product rating display in UI
function updateProductRating(productId) {
  try {
    const { average, count } = getProductRating(productId);

    // Find product elements in the DOM and update them
    document
      .querySelectorAll(`.product-card[data-id="${productId}"] .rating-display`)
      .forEach((element) => {
        if (count === 0) {
          element.innerHTML = "No reviews yet";
        } else {
          element.innerHTML = `${"★".repeat(Math.round(average))}${"☆".repeat(
            5 - Math.round(average)
          )} (${count} reviews)`;
        }
      });
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
}

// Get remaining stock for a product
function getRemainingStock(productId) {
  try {
    if (window.getRemainingStock) {
      return window.getRemainingStock(productId);
    }
    
    // Fallback stock management
    const stockData = JSON.parse(localStorage.getItem("sate_taipan_stock") || "{}");
    return stockData[productId] !== undefined ? stockData[productId] : 15; // Default to 15 if not set
  } catch (error) {
    console.error("Error getting remaining stock:", error);
    return 15; // Default to 15 on error
  }
}

// Update stock display for a product
function updateProductStockDisplay(productId) {
  try {
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
  } catch (error) {
    console.error("Error updating product stock display:", error);
  }
}

// Load and display products based on category filter
function loadProducts(filter = "all") {
  console.log("Loading products with filter:", filter);

  const productContainer = document.getElementById("products");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (!productContainer) {
    console.error("Product container not found");
    return;
  }

  try {
    // Show loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = "block";
    }

    // Clear existing products
    productContainer.innerHTML = "";

    // Filter products
    const filteredProducts = products.filter((product) => {
      if (filter === "all") return true;
      if (filter === "Popular") return product.popular;
      return product.category.toLowerCase() === filter.toLowerCase();
    });

    console.log("Filtered products:", filteredProducts.length);

    if (filteredProducts.length === 0) {
      productContainer.innerHTML = `
        <div class="alert alert-info">
          No products found for this category.
        </div>
      `;
      
      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
      return;
    }

    // Create and append product cards
    filteredProducts.forEach((product) => {
      const productCard = createProductCard(product);
      productContainer.appendChild(productCard);
      
      // Update stock display for this product
      updateProductStockDisplay(product.id);
    });

    // Attach event listeners
    attachProductEventListeners();

    console.log("Products loaded successfully");
  } catch (error) {
    console.error("Error loading products:", error);
    productContainer.innerHTML = `
      <div class="alert alert-danger">
        There was a problem loading products. Please try refreshing the page.
      </div>
    `;
  } finally {
    // Always hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  }
}