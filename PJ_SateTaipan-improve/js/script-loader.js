/**
 * script-loader.js
 * Handles consistent loading of scripts across pages to prevent errors
 */

// Track loaded scripts
const loadedScripts = new Set();

/**
 * Load a script dynamically with proper error handling
 * @param {string} src - Script URL
 * @param {Object} options - Additional options
 * @param {boolean} options.isModule - Load as ES module
 * @param {boolean} options.defer - Use defer attribute
 * @param {boolean} options.async - Use async attribute
 * @param {Function} options.onLoad - Callback when script loads
 * @param {Function} options.onError - Callback when script fails
 * @returns {Promise} - Promise that resolves when script loads
 */
function loadScript(src, options = {}) {
  // Skip if already loaded
  if (loadedScripts.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;

    // Set attributes based on options
    if (options.isModule) {
      script.type = "module";
    }

    if (options.defer) {
      script.defer = true;
    }

    if (options.async) {
      script.async = true;
    }

    // Set up load and error handlers
    script.onload = () => {
      loadedScripts.add(src);
      if (options.onLoad) {
        options.onLoad();
      }
      resolve();
    };

    script.onerror = (error) => {
      console.error(`Failed to load script: ${src}`, error);
      if (options.onError) {
        options.onError(error);
      }
      reject(error);
    };

    // Add to document
    document.head.appendChild(script);
  });
}

/**
 * Load multiple scripts in order
 * @param {Array} scripts - Array of script objects
 * @returns {Promise} - Promise that resolves when all scripts are loaded
 */
function loadScriptsSequential(scripts) {
  return scripts.reduce((promise, script) => {
    return promise.then(() => loadScript(script.src, script.options));
  }, Promise.resolve());
}

/**
 * Load multiple scripts in parallel
 * @param {Array} scripts - Array of script objects
 * @returns {Promise} - Promise that resolves when all scripts are loaded
 */
function loadScriptsParallel(scripts) {
  return Promise.all(
    scripts.map((script) => loadScript(script.src, script.options))
  );
}

/**
 * Initialize required scripts for Sate Taipan application
 * @param {string} page - Current page name (e.g., 'index', 'cart')
 */
function initializePageScripts(page) {
  // Core scripts needed for all pages
  const coreScripts = [
    { src: "js/optimized-cart-stock.js" },
    { src: "js/utils.js", options: { isModule: true } },
  ];

  // Page-specific scripts
  const pageScripts = {
    index: [
      { src: "js/product-display.js", options: { isModule: true } },
      { src: "js/bundle-display.js", options: { isModule: true } },
      { src: "js/menu-page.js", options: { isModule: true } },
    ],
    cart: [
      { src: "js/cart-manager.js", options: { isModule: true } },
      { src: "js/cart-page.js", options: { isModule: true } },
      { src: "js/form-validation.js" },
    ],
    login: [{ src: "js/login.js", options: { isModule: true } }],
    register: [{ src: "js/register.js", options: { isModule: true } }],
  };

  // Common UI scripts for all pages
  const uiScripts = [
    { src: "js/ui-enhance.js", options: { isModule: true } },
    { src: "js/three-bg.js", options: { isModule: true } },
  ];

  // Load scripts in order: first core, then page-specific, then UI
  loadScriptsSequential(coreScripts)
    .then(() => {
      console.log("Core scripts loaded");
      // Check if page-specific scripts exist
      if (page && pageScripts[page]) {
        return loadScriptsParallel(pageScripts[page]);
      }
      return Promise.resolve();
    })
    .then(() => {
      console.log("Page scripts loaded");
      return loadScriptsParallel(uiScripts);
    })
    .then(() => {
      console.log("All scripts loaded successfully");
      // Dispatch event so other components know scripts are ready
      document.dispatchEvent(new CustomEvent("scriptsLoaded"));
    })
    .catch((error) => {
      console.error("Error loading scripts:", error);
    });
}

// Automatically detect current page
function detectCurrentPage() {
  const path = window.location.pathname;
  if (path.includes("cart.html")) return "cart";
  if (path.includes("login.html")) return "login";
  if (path.includes("register.html")) return "register";
  // Default to index page
  return "index";
}

// Make functions available globally
window.scriptLoader = {
  loadScript,
  loadScriptsSequential,
  loadScriptsParallel,
  initializePageScripts,
  detectCurrentPage,
};

// Auto-initialize scripts if this script is included directly in HTML
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializePageScripts(detectCurrentPage());
  });
} else {
  initializePageScripts(detectCurrentPage());
}

// Export for module usage
export {
  loadScript,
  loadScriptsSequential,
  loadScriptsParallel,
  initializePageScripts,
  detectCurrentPage,
};
