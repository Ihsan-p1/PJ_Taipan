/**
 * modals.js - Modal operations (customization, rating)
 * Handles modal dialogs for product customization and ratings
 */

import { formatRupiah, escapeHtml, showToast } from "./utils.js";
import { addToCart } from "./cart-manager.js";
import { getProductById, saveReview } from "./product-display.js";

// Open the sauce customization modal
export function openCustomizationModal(productId) {
  console.log("openCustomizationModal called with productId:", productId);
  const modal = document.getElementById("customization-modal");
  if (!modal) {
    console.error("Customization modal not found in the DOM");
    return;
  }

  const product = getProductById(productId);
  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  const closeBtn = modal.querySelector(".close");
  const addToCartBtn = modal.querySelector(".add-to-cart-btn");

  modal.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  modal.classList.add("active");
  modal.style.display = "block";

  const formatPrice = (amount) => {
    if (typeof formatRupiah === "function") {
      return formatRupiah(amount);
    } else if (typeof window.formatRupiah === "function") {
      return window.formatRupiah(amount);
    }
    return "Rp " + amount.toLocaleString("id-ID");
  };

  function updatePrice() {
    const selectedSauces = Array.from(
      modal.querySelectorAll('input[type="checkbox"]:checked')
    ).map((cb) => cb.value);

    const saucePrice = selectedSauces.reduce(
      (total, sauce) => total + (sauce === "original" ? 0 : 1000),
      0
    );

    const totalPrice = product.price + saucePrice;
    addToCartBtn.innerHTML = `<i class="fas fa-cart-plus"></i> Add to Cart - ${formatPrice(
      totalPrice
    )}`;
  }

  updatePrice();

  modal.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", updatePrice);
  });

  addToCartBtn.onclick = async () => {
    if (addToCartBtn.disabled) return;
    addToCartBtn.disabled = true;

    try {
      const selectedSauces = Array.from(
        modal.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => cb.value);

      if (selectedSauces.length > 3) {
        if (typeof showToast === "function") {
          showToast(
            "Too Many Sambals",
            "Maximum 3 types of chilli sauce!",
            "error"
          );
        } else if (typeof window.showToast === "function") {
          window.showToast(
            "Too Many Sambals",
            "Maximum 3 types of chilli sauce!",
            "error"
          );
        } else {
          alert("Maximum 3 types of chilli sauce!");
        }
        addToCartBtn.disabled = false;
        return;
      }

      let success = false;

      if (typeof addToCart === "function") {
        success = await addToCart(product, selectedSauces);
      } else if (typeof window.addToCart === "function") {
        success = await window.addToCart(product, selectedSauces);
      } else {
        try {
          const cart = JSON.parse(
            localStorage.getItem("sate_taipan_cart") || "[]"
          );

          const saucePrice = selectedSauces.reduce(
            (total, sauce) => total + (sauce === "original" ? 0 : 1000),
            0
          );
          const totalPrice = product.price + saucePrice;

          cart.push({
            ...product,
            sauces: selectedSauces,
            price: totalPrice,
            originalPrice: product.price,
            quantity: 1,
            sauceDetails: selectedSauces.map((sauce) => ({
              name: sauce,
              price: sauce === "original" ? 0 : 1000,
            })),
          });

          localStorage.setItem("sate_taipan_cart", JSON.stringify(cart));
          success = true;

          const cartCount = document.querySelector(".cart-count");
          if (cartCount) {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? "block" : "none";
          }
        } catch (err) {
          console.error("Fallback cart adding failed:", err);
          success = false;
        }
      }

      if (success) {
        console.log("Add to cart successful for product:", product.name);
        modal.classList.remove("active");
        modal.style.display = "none";
        if (typeof showToast === "function") {
          showToast(
            "Added to Cart",
            `${product.name} added to cart with selected sambal`
          );
        } else if (typeof window.showToast === "function") {
          window.showToast(
            "Added to Cart",
            `${product.name} added to cart with selected sambal`
          );
        } else {
          alert(`${product.name} added to cart with selected sambal`);
        }
      } else {
        throw new Error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (typeof showToast === "function") {
        showToast("Error", "Failed to add item to cart", "error");
      } else if (typeof window.showToast === "function") {
        window.showToast("Error", "Failed to add item to cart", "error");
      } else {
        alert("Failed to add item to cart");
      }
    } finally {
      addToCartBtn.disabled = false;
    }
  };

  const closeModal = () => {
    modal.classList.remove("active");
    modal.style.display = "none";
  };

  closeBtn.onclick = closeModal;
  modal.onclick = (event) => {
    if (event.target === modal) {
      closeModal();
    }
  };
}

// Open the rating modal
export function openRatingModal(productId, productName) {
  const modal = document.getElementById("rating-modal");
  if (!modal) {
    console.error("Rating modal not found in the DOM");
    return;
  }

  // Access utility functions more safely
  const showMessage = (title, message, type) => {
    if (typeof showToast === "function") {
      showToast(title, message, type);
    } else if (typeof window.showToast === "function") {
      window.showToast(title, message, type);
    } else {
      alert(`${title}: ${message}`);
    }
  };

  // Safe version of saveReview
  const saveReviewSafely = (prodId, name, rating, text) => {
    try {
      // First, try the imported version
      if (typeof saveReview === "function") {
        saveReview(prodId, name, rating, text);
        return true;
      } else if (typeof window.saveReview === "function") {
        window.saveReview(prodId, name, rating, text);
        return true;
      }

      // Otherwise, implement it directly
      const reviews = JSON.parse(
        localStorage.getItem("sate_taipan_reviews") || "{}"
      );

      if (!reviews[prodId]) {
        reviews[prodId] = [];
      }

      reviews[prodId].push({
        name,
        rating,
        review: text,
        date: new Date().toISOString(),
        verified: true,
      });

      localStorage.setItem("sate_taipan_reviews", JSON.stringify(reviews));

      // Try to update UI if possible
      try {
        if (typeof updateProductRating === "function") {
          updateProductRating(prodId);
        } else if (typeof window.updateProductRating === "function") {
          window.updateProductRating(prodId);
        }
      } catch (e) {
        console.log("Could not update product rating display:", e);
      }

      return true;
    } catch (error) {
      console.error("Error saving review:", error);
      return false;
    }
  };

  const closeBtn = modal.querySelector(".close");
  const productNameElement = document.getElementById("rating-product-name");
  const stars = modal.querySelectorAll(".star"); // FIXED: Use modal.querySelectorAll
  const reviewerNameInput = document.getElementById("reviewer-name");
  const reviewTextInput = document.getElementById("review-text");
  const submitReviewBtn = document.getElementById("submit-review");
  const reviewsContainer = document.getElementById("product-reviews");
  let selectedRating = 0;

  // Reset form
  reviewerNameInput.value = "";
  reviewTextInput.value = "";
  stars.forEach((star) => star.classList.remove("active"));

  // Display product name
  if (productNameElement) {
    productNameElement.textContent = productName;
  }

  // Load existing reviews
  const reviews = JSON.parse(
    localStorage.getItem("sate_taipan_reviews") || "{}"
  );
  const productReviews = reviews[productId] || [];

  // Display existing reviews
  if (reviewsContainer) {
    reviewsContainer.innerHTML = "";

    if (productReviews.length === 0) {
      reviewsContainer.innerHTML = '<p class="text-muted">No reviews yet.</p>';
    } else {
      productReviews.forEach((review) => {
        const reviewDate = new Date(review.date).toLocaleDateString();
        const verifiedBadge = review.verified
          ? '<span class="badge bg-success">Verified Purchase</span>'
          : "";
        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

        const reviewElement = document.createElement("div");
        reviewElement.className = "review-item p-3 mb-2 bg-light rounded";
        // review.name and review.review are user input — escape them.
        reviewElement.innerHTML = `
          <div class="d-flex justify-content-between">
            <div><strong>${escapeHtml(review.name)}</strong> ${verifiedBadge}</div>
            <div class="text-muted small">${escapeHtml(reviewDate)}</div>
          </div>
          <div class="mb-1">${stars}</div>
          <p class="mb-0">${escapeHtml(review.review)}</p>
        `;
        reviewsContainer.appendChild(reviewElement);
      });
    }
  }

  // Show modal
  modal.classList.add("active");
  modal.style.display = "block";

  // FIXED: Improved star rating functionality - remove old event listeners first
  const starContainer = document.getElementById("star-rating");
  if (starContainer) {
    // Replace with new clone to remove all event listeners
    const newStarContainer = starContainer.cloneNode(true);
    starContainer.parentNode.replaceChild(newStarContainer, starContainer);

    // Get fresh references to stars
    const freshStars = newStarContainer.querySelectorAll(".star");

    // Add the click event to each star
    freshStars.forEach((star) => {
      star.addEventListener("click", function () {
        selectedRating = parseInt(this.dataset.rating, 10);

        // Update UI to show active stars
        freshStars.forEach((s) => {
          if (parseInt(s.dataset.rating, 10) <= selectedRating) {
            s.classList.add("active");
          } else {
            s.classList.remove("active");
          }
        });
      });
    });
  } else {
    // Fallback if star container not found
    stars.forEach((star) => {
      // Clone the element to remove all event listeners
      const newStar = star.cloneNode(true);
      star.parentNode.replaceChild(newStar, star);

      // Add the click event to the new element
      newStar.addEventListener("click", function () {
        selectedRating = parseInt(this.dataset.rating, 10);

        // Update UI to show active stars
        modal.querySelectorAll(".star").forEach((s) => {
          if (parseInt(s.dataset.rating, 10) <= selectedRating) {
            s.classList.add("active");
          } else {
            s.classList.remove("active");
          }
        });
      });
    });
  }

  // IMPROVED: Submit review handler
  function handleSubmitReview() {
    const name = reviewerNameInput.value.trim();
    const review = reviewTextInput.value.trim();

    // Validate input
    if (!name) {
      showMessage("Missing Name", "Please enter your name", "error");
      return;
    }
    if (!review) {
      showMessage("Missing Review", "Please write a review", "error");
      return;
    }
    if (selectedRating === 0) {
      showMessage("Missing Rating", "Please select a rating", "error");
      return;
    }

    // Save review with our safe implementation
    if (saveReviewSafely(productId, name, selectedRating, review)) {
      showMessage("Review Submitted", "Thank you for your feedback!");
      modal.style.display = "none";
    } else {
      showMessage(
        "Error",
        "Could not save your review. Please try again later.",
        "error"
      );
    }
  }

  // FIXED: Replace submitReviewBtn event listener
  if (submitReviewBtn) {
    // Remove old event listeners
    const newBtn = submitReviewBtn.cloneNode(true);
    submitReviewBtn.parentNode.replaceChild(newBtn, submitReviewBtn);

    // Add new click handler
    newBtn.addEventListener("click", handleSubmitReview);
  }

  // Close modal functionality
  function closeModal() {
    modal.classList.remove("active");
    modal.style.display = "none";
  }

  // Close button event - FIXED: Use clone to replace, removing old listeners
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener("click", closeModal);
  }

  // FIXED: Use a more specific event rather than window-wide click
  // to prevent interference with other parts of the UI
  const modalClickHandler = function (event) {
    if (event.target === modal) {
      closeModal();
      // Remove this event listener when modal is closed
      modal.removeEventListener("click", modalClickHandler);
    }
  };

  modal.addEventListener("click", modalClickHandler);
}

// Initialize modals
export function initializeModals() {
  // Add this to make original sambal display as free in the modal
  const originalSauceOption = document.querySelector(
    '.sauce-option input[value="original"]'
  );
  if (originalSauceOption) {
    const priceSpan = originalSauceOption
      .closest(".sauce-option")
      .querySelector("span");
    if (priceSpan) {
      priceSpan.textContent = "Free";
      priceSpan.className = "text-success";
    }
  }
}
