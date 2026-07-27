/**
 * bundle-display.js - Bundle rendering and management
 * Handles bundle display and interactions
 */

import { formatRupiah, getCart, saveCart, showToast } from './utils.js';
import { checkAndDecreaseBundleStock } from './stock.js';
import { products } from './data/products.js';

// Bundle definitions
const bundles = {
  couple: {
    // Items reference products by id (the single source of truth); `name` is
    // only for display. Keying on id avoids the earlier bug where a display
    // name that didn't match the catalog silently dropped paid items.
    items: [
      { id: 1, name: "Sate Taipan Original", quantity: 2 },
      { id: 4, name: "Teh Jasmine", quantity: 2 },
    ],
    freeSambal: 2,
    price: 56000,
    description: "Experience our intimate dining package perfect for two. This bundle features two portions of our signature Sate Taipan Original grilled to perfection, complemented by two refreshing Jasmine Teas. Includes two complimentary sambal sauces of your choice, allowing you to customize your flavor journey. An ideal choice for date nights or catching up with a close friend."
  },
  family: {
    items: [
      { id: 1, name: "Sate Taipan Original", quantity: 3 },
      { id: 2, name: "Sate Taipan Mozarella", quantity: 2 },
      { id: 4, name: "Teh Jasmine", quantity: 5 },
    ],
    freeSambal: 5,
    price: 112500,
    description: "Bring the whole family together with our generous Family Bundle. Featuring three orders of our classic Sate Taipan Original, two premium Sate Taipan Mozarella topped with melted mozzarella, and five Jasmine Teas for everyone to enjoy. Complete with five free sambal sauces to satisfy every taste preference. Perfect for family gatherings of 4-5 people."
  },
  party: {
    items: [
      { id: 1, name: "Sate Taipan Original", quantity: 5 },
      { id: 2, name: "Sate Taipan Mozarella", quantity: 3 },
      { id: 3, name: "Sate Taipan Telur", quantity: 2 },
      { id: 4, name: "Teh Jasmine", quantity: 10 },
    ],
    freeSambal: 10,
    price: 175000,
    description: "Make your celebration memorable with our ultimate Party Bundle. This feast includes five of our signature Sate Taipan Original, three cheese-topped Sate Taipan Mozarella, two protein-packed Sate Taipan Telur, and ten refreshing Jasmine Teas. We've added ten complimentary sambal sauces to enhance your festive dining experience. Ideal for parties and gatherings of 8-10 people."
  },
};

// Get all bundle definitions
function getAllBundles() {
  return bundles;
}

// Get bundle by type
function getBundleByType(bundleType) {
  return bundles[bundleType];
}

// Render bundle cards
function renderBundleCards() {
  const bundleContainer = document.getElementById("bundle-container");
  if (!bundleContainer) {
    console.error("Bundle container not found in the DOM");
    return;
  }

  // Clear any shimmer placeholders or existing content
  bundleContainer.innerHTML = "";

  Object.keys(bundles).forEach((bundleType) => {
    const bundle = bundles[bundleType];
    const bundleName =
      bundleType.charAt(0).toUpperCase() +
      bundleType.slice(1) +
      " Bundle";

    // Create list items for bundle contents
    const bundleItemsList = bundle.items
      .map((item) => `<li>${item.quantity}× ${item.name}</li>`)
      .join("");

    // Free sambal note
    const sambalNote = `<li style="color: var(--secondary); font-style: italic">*Free ${bundle.freeSambal} sambal of your choice</li>`;

    // Calculate savings percentage
    const savingsPercent =
      bundleType === "couple"
        ? "20%"
        : bundleType === "family"
        ? "25%"
        : "30%";

    // Calculate original price
    const originalPrice =
      bundle.price *
      (bundleType === "couple"
        ? 1.25
        : bundleType === "family"
        ? 1.33
        : 1.43);

    const bundleCard = document.createElement("div");
    bundleCard.className = "bundle-card";
    bundleCard.innerHTML = `
      <div class="bundle-header">
        <span class="bundle-name">${bundleName}</span>
        <span class="bundle-save">Save ${savingsPercent}</span>
      </div>
        <p class="bundle-description">${bundle.description}</p>
      <ul class="bundle-items">
        ${bundleItemsList}
        ${sambalNote}
      </ul>
      <div class="bundle-price-wrapper">
        <div class="original-price">${formatRupiah(originalPrice)}</div>
        <div class="promo-price">${formatRupiah(bundle.price)}</div>
        <button class="bundle-btn" data-bundle-type="${bundleType}">
          <i class="fas fa-cart-plus me-2"></i> Add to Cart
        </button>
      </div>
    `;

    bundleContainer.appendChild(bundleCard);
  });

  // Add event listeners to bundle buttons after they're added to the DOM
  attachBundleEventListeners();
}

// Add bundle to cart (reserving stock for every item first)
function addBundleToCart(bundleType) {
  const bundle = bundles[bundleType];
  if (!bundle) {
    console.error("Bundle not found:", bundleType);
    return false;
  }

  const bundleName =
    bundleType.charAt(0).toUpperCase() + bundleType.slice(1) + " Bundle";

  // Resolve bundle items to products by id and check stock atomically.
  const resolved = bundle.items
    .map((item) => ({
      product: products.find((p) => p.id === item.id),
      quantity: item.quantity,
    }))
    .filter((entry) => entry.product);

  const stockRequest = resolved.map((entry) => ({
    id: entry.product.id,
    quantity: entry.quantity,
  }));

  if (!checkAndDecreaseBundleStock(stockRequest)) return false;

  const cart = getCart();
  resolved.forEach(({ product, quantity }) => {
    for (let i = 0; i < quantity; i++) {
      cart.push({
        ...product,
        sauces: [],
        price: product.price,
        originalPrice: product.price,
        quantity: 1,
        bundleInfo: { name: bundleName, type: bundleType },
      });
    }
  });

  saveCart(cart);
  showToast("Bundle Added", `${bundleName} has been added to your cart`);
  return true;
}

// Attach event listeners to bundle buttons
function attachBundleEventListeners() {
  document.querySelectorAll(".bundle-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const bundleType = e.currentTarget.dataset.bundleType;
      addBundleToCart(bundleType);
    });
  });
}

// Initialize bundles display
function initializeBundleDisplay() {
  console.log("Initializing bundle display...");
  renderBundleCards();
}

export { 
  bundles, 
  getAllBundles, 
  getBundleByType, 
  renderBundleCards, 
  initializeBundleDisplay,
  addBundleToCart
};