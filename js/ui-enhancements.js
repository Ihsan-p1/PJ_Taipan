/**
 * ui-enhancements.js
 *
 * Modern UI/UX enhancements for the Sate Taipan website
 * Adds animations, interactions, and visual improvements
 * 
 * NOTE: This is the fixed version, matching the actual filename referenced in HTML
 */

// Define all functions first
/**
 * Initialize scroll-based effects like header shrinking
 */
function initScrollEffects() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  // Add scroll event listener
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Trigger initial check
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  }
}

/**
 * Enhance form input fields with interactive behaviors
 */
function enhanceFormInputs() {
  // Select all form inputs
  const formInputs = document.querySelectorAll("input, textarea");

  formInputs.forEach((input) => {
    // Add focus class to parent form-group when input is focused
    input.addEventListener("focus", () => {
      input.closest(".form-group")?.classList.add("focused");
    });

    // Remove focus class when input loses focus
    input.addEventListener("blur", () => {
      input.closest(".form-group")?.classList.remove("focused");

      // Add 'has-value' class if the input has a value
      if (input.value.trim() !== "") {
        input.classList.add("has-value");
      } else {
        input.classList.remove("has-value");
      }
    });

    // Check initial value
    if (input.value.trim() !== "") {
      input.classList.add("has-value");
    }
  });

  // Add real-time validation
  const phoneInput = document.getElementById("customer-phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      // Remove non-numeric characters
      e.target.value = e.target.value.replace(/[^0-9+\-\s]/g, "");
    });
  }

  // Add "copy to clipboard" functionality for product names
  document.querySelectorAll(".product-name").forEach((name) => {
    name.title = "Click to copy product name";
    name.classList.add("clickable");

    name.addEventListener("click", () => {
      navigator.clipboard.writeText(name.textContent.trim()).then(() => {
        // Show mini toast
        const miniToast = document.createElement("div");
        miniToast.className = "mini-toast fade-in-out";
        miniToast.textContent = "Copied!";
        name.appendChild(miniToast);

        // Remove after animation completes
        setTimeout(() => {
          miniToast.remove();
        }, 2000);
      });
    });
  });
}

/**
 * Enhance modal animations and interactions
 */
function enhanceModalAnimations() {
  // Target all modals
  const modals = document.querySelectorAll(".modal");

  modals.forEach((modal) => {
    // Get the close button
    const closeBtn = modal.querySelector(".close");
    const modalContent = modal.querySelector(".modal-content");

    // Find any buttons that might open this modal
    const modalId = modal.id;
    const openButtons = document.querySelectorAll(
      `[data-modal="${modalId}"], [data-open-modal="${modalId}"]`
    );

    // Add open modal functionality
    openButtons.forEach((button) => {
      button.addEventListener("click", () => {
        openModal(modal);
      });
    });

    // Add close modal functionality
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal(modal);
      });
    }

    // Close modal when clicking outside content
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });

    // Add keyboard accessibility - close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display === "block") {
        closeModal(modal);
      }
    });
  });
}

/**
 * Open a modal with enhanced animation
 */
function openModal(modal) {
  if (!modal) return;

  // First make the modal visible but transparent
  modal.style.display = "block";
  modal.classList.add("active");

  // Prevent scrolling on the body
  document.body.style.overflow = "hidden";

  // Add animation class to modal content
  const content = modal.querySelector(".modal-content");
  if (content) {
    content.classList.add("show");
  }
}

/**
 * Close a modal with enhanced animation
 */
function closeModal(modal) {
  if (!modal) return;

  // First remove the active class
  modal.classList.remove("active");

  // Remove show class from content
  const content = modal.querySelector(".modal-content");
  if (content) {
    content.classList.remove("show");
  }

  // Wait for animation to finish, then hide the modal
  setTimeout(() => {
    modal.style.display = "none";

    // Restore scrolling
    document.body.style.overflow = "";
  }, 300);
}

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
  // Check if browser supports Intersection Observer
  if ("IntersectionObserver" in window) {
    const imgOptions = {
      root: null,
      threshold: 0,
      rootMargin: "0px 0px 50px 0px",
    };

    const imgObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        const dataSrc = img.getAttribute("data-src");

        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute("data-src");

          // Add loaded class for fade-in effect
          img.classList.add("loaded");
        }

        observer.unobserve(img);
      });
    }, imgOptions);

    // Target all images with data-src attribute
    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => {
      imgObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support Intersection Observer
    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => {
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
      img.classList.add("loaded");
    });
  }
}

/**
 * Initialize touch gestures for mobile devices
 */
function initTouchGestures() {
  // Add swipe gesture to product cards
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    let startX;
    let startY;

    card.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    card.addEventListener("touchend", (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = startX - endX;
      const diffY = startY - endY;

      // Check if it's a horizontal swipe (more horizontal than vertical)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Left swipe (threshold of 50px)
        if (diffX > 50) {
          // Add to cart button click
          const addToCartBtn = card.querySelector(".add-to-cart");
          if (addToCartBtn) {
            addToCartBtn.click();

            // Show swipe indicator
            const indicator = document.createElement("div");
            indicator.className = "swipe-indicator left";
            indicator.innerHTML = '<i class="fas fa-cart-plus"></i>';
            card.appendChild(indicator);

            setTimeout(() => {
              indicator.remove();
            }, 1000);
          }
        }

        // Right swipe
        if (diffX < -50) {
          // Rating button click
          const rateBtn = card.querySelector(".rate-product");
          if (rateBtn) {
            rateBtn.click();

            // Show swipe indicator
            const indicator = document.createElement("div");
            indicator.className = "swipe-indicator right";
            indicator.innerHTML = '<i class="fas fa-star"></i>';
            card.appendChild(indicator);

            setTimeout(() => {
              indicator.remove();
            }, 1000);
          }
        }
      }

      // Reset start positions
      startX = null;
      startY = null;
    });
  });

  // Add swipe to delete for cart items
  const cartItems = document.querySelectorAll(".cart-item");

  cartItems.forEach((item) => {
    let startX;

    item.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    item.addEventListener("touchend", (e) => {
      if (!startX) return;

      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;

      // Left swipe (threshold of 100px)
      if (diffX > 100) {
        // Find and click the remove button
        const removeBtn = item.querySelector(".remove-item");
        if (removeBtn) {
          // Add swiping-left class for animation
          item.classList.add("swiping-left");

          // Wait for animation then click the remove button
          setTimeout(() => {
            removeBtn.click();
          }, 300);
        }
      }

      // Reset start positions
      startX = null;
    });
  });
}

/**
 * Enhance accessibility features
 */
function enhanceAccessibility() {
  // Add focus outline styles
  const focusableElements = document.querySelectorAll(
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );

  focusableElements.forEach((element) => {
    element.addEventListener("focus", () => {
      element.classList.add("focus-visible");
    });

    element.addEventListener("blur", () => {
      element.classList.remove("focus-visible");
    });
  });

  // Add aria labels where missing
  document.querySelectorAll("button:not([aria-label])").forEach((button) => {
    // If button has only icon, add aria-label
    if (button.innerText.trim() === "" && button.querySelector("i")) {
      const iconClass = button.querySelector("i").className;

      // Set aria-label based on icon class
      if (iconClass.includes("trash")) {
        button.setAttribute("aria-label", "Remove item");
      } else if (iconClass.includes("plus")) {
        button.setAttribute("aria-label", "Increase quantity");
      } else if (iconClass.includes("minus")) {
        button.setAttribute("aria-label", "Decrease quantity");
      }
    }
  });
}

/**
 * Initialize shimmer loading effects for content that loads dynamically
 */
function initShimmerEffects() {
  // Create and add shimmer placeholder for product grid
  const productGrid = document.getElementById("products");
  if (productGrid && productGrid.children.length === 0) {
    const productCount = window.innerWidth >= 768 ? 6 : 4;

    for (let i = 0; i < productCount; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "product-card shimmer shimmer-placeholder";
      placeholder.innerHTML = `
        <div class="product-image-placeholder"></div>
        <div class="product-details">
          <div class="shimmer-line"></div>
          <div class="shimmer-line short"></div>
          <div class="shimmer-line medium"></div>
          <div class="product-actions">
            <div class="shimmer-button"></div>
            <div class="shimmer-button small"></div>
          </div>
        </div>
      `;
      productGrid.appendChild(placeholder);
    }
  }

  // Create shimmer placeholder for bundle container
  const bundleContainer = document.getElementById("bundle-container");
  if (bundleContainer && bundleContainer.children.length === 0) {
    const bundleCount = window.innerWidth >= 768 ? 3 : 2;

    for (let i = 0; i < bundleCount; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "bundle-card shimmer shimmer-placeholder";
      placeholder.innerHTML = `
        <div class="bundle-header">
          <div class="shimmer-line"></div>
          <div class="shimmer-badge"></div>
        </div>
        <div class="shimmer-line"></div>
        <div class="shimmer-line"></div>
        <div class="shimmer-line"></div>
        <div class="bundle-price-wrapper">
          <div class="shimmer-line short"></div>
          <div class="shimmer-line medium"></div>
          <div class="shimmer-button"></div>
        </div>
      `;
      bundleContainer.appendChild(placeholder);
    }
  }

  // Remove shimmer placeholders after 2 seconds
  setTimeout(() => {
    document.querySelectorAll(".shimmer-placeholder").forEach((placeholder) => {
      placeholder.classList.add("fade-out");
      setTimeout(() => {
        placeholder.remove();
      }, 500);
    });
  }, 2000);
}

// Main initialization function
function initialize() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
}

// Initialize all UI enhancements
function initAll() {
  // Add scroll event listener for header effects
  initScrollEffects();

  // Enhance form inputs with validation and animations
  enhanceFormInputs();

  // Add modal animations
  enhanceModalAnimations();

  // Add responsive image loading
  initLazyLoading();

  // Add touch gestures
  initTouchGestures();

  // Add accessible focus states
  enhanceAccessibility();

  // Initialize shimmer loading effects
  initShimmerEffects();
}

// Call initialize when module is loaded
initialize();

// Make functions available globally
window.uiEnhancements = {
  openModal,
  closeModal,
  initScrollEffects,
  enhanceFormInputs,
  enhanceModalAnimations,
};

// Export functions for module usage
export {
  openModal,
  closeModal,
  initScrollEffects,
  enhanceFormInputs,
  enhanceModalAnimations,
};