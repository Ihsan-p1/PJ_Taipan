/**
 * _setup.mjs — Minimal browser-global stubs so the app's ES modules can run
 * under Node's built-in test runner (`node --test`) with ZERO dependencies.
 *
 * The app targets the browser (localStorage, document, Web Crypto). Rather than
 * pull in jsdom (which would force a package.json + npm install and break this
 * repo's "no build step / no dependencies" rule), we provide the tiny surface
 * the units under test actually touch.
 *
 * Import this FIRST in every test file so the globals exist before the app
 * modules are evaluated.
 */

class MemoryStorage {
  #store = new Map();
  getItem(key) {
    return this.#store.has(key) ? this.#store.get(key) : null;
  }
  setItem(key, value) {
    this.#store.set(key, String(value));
  }
  removeItem(key) {
    this.#store.delete(key);
  }
  clear() {
    this.#store.clear();
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A createElement stub whose textContent → innerHTML round-trip escapes HTML,
// mirroring the real DOM trick used by utils.escapeHtml.
function createElement() {
  let text = "";
  return {
    set textContent(value) {
      text = value == null ? "" : String(value);
    },
    get textContent() {
      return text;
    },
    get innerHTML() {
      return escapeHtml(text);
    },
    appendChild() {},
    setAttribute() {},
  };
}

if (!globalThis.localStorage) globalThis.localStorage = new MemoryStorage();
if (!globalThis.sessionStorage) globalThis.sessionStorage = new MemoryStorage();
if (!globalThis.window) globalThis.window = globalThis;
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (fn) => fn();
}

globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement,
  addEventListener: () => {},
  dispatchEvent: () => {},
  body: { style: {} },
};

/** Reset persisted state between tests. */
export function resetStorage() {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
}
