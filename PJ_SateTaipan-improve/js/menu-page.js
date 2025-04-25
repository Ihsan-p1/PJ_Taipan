/**
 * menu-page.js - Menu page specific functionality
 * Main entry point for the index.html page
 */

import { updateCartCount } from './utils.js';
import { loadProducts, initializeProductDisplay } from './product-display.js';
import { initializeBundleDisplay } from './bundle-display.js';
import { initializeModals } from './modals.js';
import { initThreeJSBackground } from './three-bg.js';
import { initStockManagement } from './stock-management.js';

// Initialize the menu page
function initializeMenuPage() {
  try {
    console.log('Initializing menu page...');
    
    // First, make sure products are loaded
    loadProducts('all');
    
    // Then initialize other components
    updateCartCount();
    initializeProductDisplay();
    initializeBundleDisplay();
    initializeModals();
    initStockManagement();
    
    // Add category filter listeners
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        // Get category and load products
        const category = button.dataset.category;
        console.log('Loading category:', category);
        loadProducts(category);
      });
    });

    // Initialize Three.js background with delay to ensure DOM is ready
    setTimeout(() => {
      try {
        initThreeJSBackground();
      } catch (error) {
        console.error("Error initializing Three.js background:", error);
        // Non-critical failure, site can still function without the background
      }
    }, 500);

    console.log('Menu page initialized successfully');
  } catch (error) {
    console.error('Error initializing menu page:', error);
    // Fallback - try to load products directly
    try {
      loadProducts('all');
      updateCartCount();
    } catch (innerError) {
      console.error('Critical error in fallback initialization:', innerError);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeMenuPage);
} else {
  // If DOM is already loaded, initialize immediately
  initializeMenuPage();
}

// Export the initialization function for potential external use
export { initializeMenuPage };