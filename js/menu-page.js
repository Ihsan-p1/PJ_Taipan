/**
 * menu-page.js — Entry point for index.html.
 *
 * This is the single ES-module entry the page loads; it imports and wires up
 * every feature the storefront needs.
 */

import { updateCartCount } from "./utils.js";
import { initializeProductDisplay } from "./product-display.js";
import { initializeBundleDisplay } from "./bundle-display.js";
import { initializeModals } from "./modals.js";
import { initThreeJSBackground } from "./three-bg.js";
import { initStock } from "./stock.js";
import { initIntroPopup } from "./intro-popup.js";
import { initNavAuth } from "./auth.js";

function initializeMenuPage() {
  try {
    initNavAuth(); // render Login / user + Logout in the navbar
    initializeProductDisplay(); // renders the grid + wires category filters
    initStock(); // paint stock badges on the freshly rendered cards
    updateCartCount();
    initializeBundleDisplay();
    initializeModals();
    initIntroPopup();

    // The 3D background is a nice-to-have; never let it break the page.
    setTimeout(() => {
      try {
        initThreeJSBackground();
      } catch (error) {
        console.error("Three.js background failed to start:", error);
      }
    }, 500);
  } catch (error) {
    console.error("Error initializing menu page:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeMenuPage);
} else {
  initializeMenuPage();
}

export { initializeMenuPage };
