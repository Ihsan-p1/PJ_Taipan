/**
 * cart-page.js - Cart page specific functionality
 * Handles rendering and managing cart items on the cart page
 * OPTIMIZED VERSION - Removes delivery fee and improves performance
 */

import { getCart, formatRupiah, escapeHtml, showToast, placeOrder } from './utils.js';
import { decreaseQuantity, increaseQuantity, updateQuantity, removeItem, clearCart } from './cart-manager.js';
import { createSkewer3DIcon } from './three-bg.js';

// Cache DOM references
let cartContentElement = null;
let customerDetailsSection = null;

/**
 * Render the entire cart
 * Displays all items, calculates total, and sets up event listeners
 */
function renderCart() {
  console.log("Rendering cart...");
  
  // Get cart data
  const cart = getCart();
  
  // Get cart content element (with caching)
  if (!cartContentElement) {
    cartContentElement = document.getElementById("cart-content");
  }
  
  if (!cartContentElement) {
    console.error("Cart content element not found");
    return;
  }

  // Handle empty cart
  if (cart.length === 0) {
    cartContentElement.innerHTML = `
      <div class="cart-section empty-cart">
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <a href="index.html" class="browse-menu-button">
          <i class="fas fa-utensils me-2"></i> Browse Menu
        </a>
      </div>
    `;

    // Hide customer details section
    if (!customerDetailsSection) {
      customerDetailsSection = document.getElementById("customer-details-section");
    }
    
    if (customerDetailsSection) {
      customerDetailsSection.style.display = "none";
    }
    return;
  }

  // Calculate total - removed delivery fee
  let total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Generate cart HTML 
  let cartHTML = `
    <div class="cart-section">
      <h4 class="mb-4"><i class="fas fa-utensils me-2"></i> Order Items</h4>
  `;

  // Add cart items
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    cartHTML += `
      <div class="cart-item" data-index="${index}">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          ${
            item.sauces && item.sauces.length > 0
              ? `<div class="cart-item-sauces">+ ${item.sauces.join(
                  ", "
                )}</div>`
              : ""
          }
        </div>
        <div class="cart-item-quantity">
          <button class="quantity-btn decrease-quantity" data-index="${index}">
            <i class="fas fa-minus"></i>
          </button>
          <input type="number" min="1" value="${
            item.quantity
          }" class="quantity-input" data-index="${index}">
          <button class="quantity-btn increase-quantity" data-index="${index}">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="cart-item-price">${formatRupiah(itemTotal)}</div>
        <div class="cart-item-action">
          <button class="remove-item" data-index="${index}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  });

  // Add cart summary - OPTIMIZED: Removed delivery fee completely
  cartHTML += `
      <div class="cart-summary">
        <div>
          <h5>Order Summary</h5>
          <div>Total: ${formatRupiah(total)}</div>
        </div>
        <div class="cart-total">Total: ${formatRupiah(total)}</div>
      </div>
      <div class="clear-cart-container">
        <button id="clear-cart-btn" class="clear-cart-btn">
          <i class="fas fa-trash-alt me-2"></i> Clear All Items
        </button>
      </div>
    </div>
  `;

  // Update DOM
  cartContentElement.innerHTML = cartHTML;

  // Show customer details section
  if (!customerDetailsSection) {
    customerDetailsSection = document.getElementById("customer-details-section");
  }
  
  if (customerDetailsSection) {
    customerDetailsSection.style.display = "block";
  }

  // Add event listeners for cart interaction
  attachCartEventListeners();
  
  console.log("Cart rendered successfully");
}

/**
 * Attach event listeners to cart elements
 * Uses event delegation where possible for better performance
 */
function attachCartEventListeners() {
  // Use event delegation for quantity buttons and remove buttons
  cartContentElement.addEventListener("click", (e) => {
    // Handle decrease quantity
    if (e.target.closest(".decrease-quantity")) {
      const button = e.target.closest(".decrease-quantity");
      const index = parseInt(button.dataset.index);
      handleDecreaseQuantity(index);
    }
    
    // Handle increase quantity
    if (e.target.closest(".increase-quantity")) {
      const button = e.target.closest(".increase-quantity");
      const index = parseInt(button.dataset.index);
      handleIncreaseQuantity(index);
    }
    
    // Handle remove item
    if (e.target.closest(".remove-item")) {
      const button = e.target.closest(".remove-item");
      const index = parseInt(button.dataset.index);
      handleRemoveItem(index);
    }
  });

  // Handle quantity input changes
  cartContentElement.querySelectorAll(".quantity-input").forEach((input) => {
    input.addEventListener("change", handleQuantityInputChange);
  });
  
  // Setup clear cart button
  const clearCartBtn = document.getElementById("clear-cart-btn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", handleClearCart);
  }
}

/**
 * Handle quantity input changes
 */
function handleQuantityInputChange(e) {
  const index = parseInt(e.target.dataset.index);
  const newQuantity = parseInt(e.target.value);
  
  if (updateQuantity(index, newQuantity)) {
    renderCart();
  } else {
    // Reset to 1 if invalid input
    e.target.value = 1;
  }
}

/**
 * Handle decrease quantity button click
 */
function handleDecreaseQuantity(index) {
  if (decreaseQuantity(index)) {
    renderCart();
  }
}

/**
 * Handle increase quantity button click
 */
function handleIncreaseQuantity(index) {
  if (increaseQuantity(index)) {
    renderCart();
  }
}

/**
 * Handle remove item button click
 */
function handleRemoveItem(index) {
  if (removeItem(index)) {
    renderCart();
  }
}

/**
 * Handle clear all items button click
 */
function handleClearCart() {
  // Show confirmation dialog
  if (confirm("Are you sure you want to remove all items from your cart?")) {
    if (clearCart()) {
      renderCart();
    }
  }
}

/**
 * Handle order placement
 * Collects customer details and places the order
 */
function handleOrderPlacement(e) {
  e.preventDefault();
  console.log("Placing order...");

  // Validate cart
  const cart = getCart();
  if (cart.length === 0) {
    showToast(
      "Empty Cart",
      "Your cart is empty. Please add items before placing an order.",
      "error"
    );
    return;
  }

  // Validate form fields
  const customerName = document.getElementById("customer-name");
  const customerPhone = document.getElementById("customer-phone");
  const customerAddress = document.getElementById("customer-address");
  
  if (!customerName || !customerName.value.trim()) {
    showToast("Missing Information", "Please enter your name", "error");
    customerName?.focus();
    return;
  }
  
  if (!customerPhone || !customerPhone.value.trim()) {
    showToast("Missing Information", "Please enter your phone number", "error");
    customerPhone?.focus();
    return;
  }
  
  if (!customerAddress || !customerAddress.value.trim()) {
    showToast("Missing Information", "Please enter your delivery address", "error");
    customerAddress?.focus();
    return;
  }

  // Get customer details
  const customerDetails = {
    name: customerName.value.trim(),
    phone: customerPhone.value.trim(),
    email: document.getElementById("customer-email")?.value.trim() || "",
    address: customerAddress.value.trim(),
    notes: document.getElementById("delivery-notes")?.value.trim() || "",
  };

  // Calculate total - OPTIMIZED: No delivery fee
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Process order
  try {
    placeOrder(cart);
    
    // Show confirmation screen
    document.body.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); 
                display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: white; padding: 2rem; border-radius: 20px; text-align: center; max-width: 400px;">
          <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;"></i>
          <h2>Order Confirmed!</h2>
          <p>Thank you for your order, ${escapeHtml(customerDetails.name)}!</p>
          <p>Your total is ${formatRupiah(total)}.</p>
          <p>Your order will be delivered to:</p>
          <p style="font-weight: 600;">${escapeHtml(customerDetails.address)}</p>
          <button id="confirm-btn" style="background: var(--primary); color: white; border: none; 
                    padding: 0.8rem 2rem; border-radius: 50px; margin-top: 1rem; font-weight: 600; cursor: pointer;">
            Return to Home
          </button>
        </div>
      </div>
    `;

    // Add event listener to the confirmation button
    document.getElementById("confirm-btn").addEventListener("click", () => {
      window.location.href = "index.html";
    });
    
    console.log("Order placed successfully");
  } catch (error) {
    console.error("Error placing order:", error);
    showToast("Error", "There was a problem placing your order. Please try again.", "error");
  }
}

/**
 * Initialize cart page functionality
 * Sets up the cart display and event handlers
 */
function initializeCartPage() {
  console.log("Initializing cart page...");
  
  // Render cart initially
  renderCart();
  
  // Setup order form submission
  const deliveryForm = document.getElementById("delivery-form");
  if (deliveryForm) {
    deliveryForm.addEventListener("submit", handleOrderPlacement);
  } else {
    console.error("Delivery form not found");
  }
  
  // Make functions available globally
  window.renderCart = renderCart;
  
  console.log("Cart page initialized successfully");
}

// Export functions
export {
  renderCart,
  initializeCartPage
};