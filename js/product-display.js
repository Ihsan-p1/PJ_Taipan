/**
 * product-display.js — Product rendering, filtering, and reviews.
 *
 * Product data comes from ./data/products.js and stock logic from ./stock.js;
 * this module only turns them into DOM.
 */

import { formatRupiah, escapeHtml, showToast } from "./utils.js";
import { openCustomizationModal, openRatingModal } from "./modals.js";
import { addToCart } from "./cart-manager.js";
import { products } from "./data/products.js";
import { getRemainingStock, updateProductStockDisplay } from "./stock.js";

const REVIEWS_KEY = "sate_taipan_reviews";

// ----- Lookups -------------------------------------------------------------

function getProductById(productId) {
  return products.find((product) => product.id === productId);
}

function getAllProducts() {
  return products;
}

// ----- Reviews -------------------------------------------------------------

function readReviews() {
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
  } catch (error) {
    console.error("Error reading reviews:", error);
    return {};
  }
}

function getProductRating(productId) {
  const reviews = readReviews();
  const list = reviews[productId];
  if (!list || list.length === 0) return { average: 0, count: 0 };

  const total = list.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / list.length) * 10) / 10,
    count: list.length,
  };
}

function saveReview(productId, name, rating, reviewText) {
  try {
    const reviews = readReviews();
    if (!reviews[productId]) reviews[productId] = [];
    reviews[productId].push({
      name,
      rating,
      review: reviewText,
      date: new Date().toISOString(),
      verified: true,
    });
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    updateProductRating(productId);
  } catch (error) {
    console.error("Error saving review:", error);
    showToast("Error", "There was a problem saving your review.", "error");
  }
}

function ratingStars(average, count) {
  if (count === 0) return "No reviews yet";
  const filled = Math.round(average);
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)} (${count} reviews)`;
}

function updateProductRating(productId) {
  const { average, count } = getProductRating(productId);
  document
    .querySelectorAll(`.product-card[data-id="${productId}"] .rating-display`)
    .forEach((element) => {
      element.textContent = ratingStars(average, count);
    });
}

// ----- Rendering -----------------------------------------------------------

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.id = product.id;

  const remaining = getRemainingStock(product.id);
  const isOutOfStock = remaining <= 0;
  const { average, count } = getProductRating(product.id);

  let stockIndicatorHtml = "";
  if (isOutOfStock) {
    stockIndicatorHtml = `<div class="stock-indicator out-of-stock">Sold Out</div>`;
  } else if (remaining <= 3) {
    stockIndicatorHtml = `<div class="stock-indicator low-stock critical">Only ${remaining} left!</div>`;
  } else if (remaining <= 5) {
    stockIndicatorHtml = `<div class="stock-indicator low-stock">Low Stock: ${remaining}</div>`;
  }

  const name = escapeHtml(product.name);
  const description = escapeHtml(product.description || "");
  const category = escapeHtml(product.category);

  card.innerHTML = `
    <div class="product-image-container">
      <img src="${product.image}" class="product-image" alt="${name}"
        onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}'">
      <div class="product-category-tag">${category}</div>
      ${stockIndicatorHtml}
      ${isOutOfStock ? '<div class="sold-out-overlay"><div class="sold-out-message">Sold Out</div></div>' : ""}
    </div>
    <div class="product-details">
      <h5 class="product-name">${name}</h5>
      <div class="rating-display">${ratingStars(average, count)}</div>
      <p class="product-description">${description}</p>
      <p class="product-price">${formatRupiah(product.price)}</p>
      <div class="product-actions">
        <button class="add-to-cart" data-id="${product.id}" ${isOutOfStock ? "disabled" : ""}>
          <i class="fas fa-cart-plus me-1"></i> ${isOutOfStock ? "Sold Out" : "Add to Cart"}
        </button>
        <button class="rate-product" data-id="${product.id}" data-name="${name}">
          <i class="fas fa-star"></i>
        </button>
      </div>
    </div>
  `;

  return card;
}

// Event delegation for add-to-cart and rate buttons.
function attachProductEventListeners() {
  const productsContainer = document.getElementById("products");
  if (!productsContainer || productsContainer.dataset.bound === "true") return;
  productsContainer.dataset.bound = "true";

  productsContainer.addEventListener("click", async (e) => {
    const addButton = e.target.closest(".add-to-cart");
    if (addButton) {
      if (addButton.disabled) return;
      addButton.disabled = true;
      try {
        const product = getProductById(parseInt(addButton.dataset.id, 10));
        if (!product) return;

        if (product.category === "Food") {
          openCustomizationModal(product.id);
        } else {
          const success = await addToCart(product, []);
          if (success) showToast("Success", `${product.name} added to cart`);
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        showToast("Error", "Failed to add item to cart", "error");
      } finally {
        setTimeout(() => {
          if (getRemainingStock(parseInt(addButton.dataset.id, 10)) > 0) {
            addButton.disabled = false;
          }
        }, 500);
      }
    }

    const rateButton = e.target.closest(".rate-product");
    if (rateButton) {
      openRatingModal(parseInt(rateButton.dataset.id, 10), rateButton.dataset.name);
    }
  });
}

// Load and display products for a category filter.
function loadProducts(filter = "all") {
  const productContainer = document.getElementById("products");
  const loadingIndicator = document.getElementById("loading-indicator");
  if (!productContainer) return;

  try {
    if (loadingIndicator) loadingIndicator.style.display = "block";
    productContainer.innerHTML = "";

    const filtered = products.filter((product) => {
      if (filter === "all") return true;
      if (filter === "Popular") return product.popular;
      return product.category.toLowerCase() === filter.toLowerCase();
    });

    if (filtered.length === 0) {
      productContainer.innerHTML =
        '<div class="alert alert-info">No products found for this category.</div>';
      return;
    }

    filtered.forEach((product) => {
      productContainer.appendChild(createProductCard(product));
      updateProductStockDisplay(product.id);
    });

    attachProductEventListeners();
  } catch (error) {
    console.error("Error loading products:", error);
    productContainer.innerHTML =
      '<div class="alert alert-danger">There was a problem loading products. Please try refreshing the page.</div>';
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = "none";
  }
}

// Wire up the category filter buttons and render the initial grid.
function initializeProductDisplay() {
  loadProducts("all");

  document.querySelectorAll(".category-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const category = this.dataset.category;
      if (!category) return;
      document
        .querySelectorAll(".category-btn")
        .forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      loadProducts(category);
    });
  });
}

export {
  getProductById,
  getAllProducts,
  saveReview,
  getProductRating,
  loadProducts,
  initializeProductDisplay,
};
