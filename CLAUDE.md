# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A fully client‑side storefront demo for a fictional satay stall ("Sate Taipan").
Vanilla HTML + CSS + **native ES‑module** JavaScript. **No build step, no
framework, no backend, no package.json.** All state (cart, orders, reviews,
stock) lives in the browser's `localStorage`.

## Running / developing

ES modules require an HTTP origin — opening the `.html` files directly
(`file://`) will not work. Serve the repo root:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

There are no tests, linters, or CI configured. There is nothing to build.

## Architecture

Each HTML page loads **exactly one ES‑module entry point** with
`<script type="module">`; that entry imports everything else. Do not add
competing script loaders or duplicate `<script>` tags.

| Page            | Entry module        |
| --------------- | ------------------- |
| `index.html`    | `js/menu-page.js`   |
| `cart.html`     | `js/cart-page.js`   |
| `login.html`    | `js/login.js`       |
| `register.html` | `js/register.js`    |

Key module responsibilities and the import graph:

- `js/data/products.js` — **single source of truth** for the catalog
  (`export const products`). Never hard‑code product data anywhere else.
- `js/stock.js` — **the only** stock service: read, decrement (single +
  bundle), 24h reset, and DOM badge rendering. Imports `products` + `utils`.
- `js/utils.js` — cart storage (`getCart`/`saveCart`), `formatRupiah`,
  `escapeHtml`, `showToast`, order helpers. No internal imports (leaf module).
- `js/cart-manager.js` — add/update/remove cart items. `addToCart()` reserves
  stock via `stock.js` **before** adding — this is where stock is enforced.
- `js/product-display.js` — renders the grid, filters, and reviews. Imports
  `products`, `stock`, `utils`, `modals`, `cart-manager`.
- `js/modals.js` — sauce customization + rating/review modals. Has a
  circular import with `product-display.js` (both are functions, so ES‑module
  cyclic binding is fine — keep it that way).
- `js/bundle-display.js`, `js/three-bg.js`, `js/ui-enhancements.js`,
  `js/form-number-validation.js` — bundles, 3D background, progressive
  enhancements, phone formatting.

### Conventions that matter here

- **One source of truth per concern.** This repo was cleaned up from a state
  with duplicated product arrays and five overlapping stock scripts. Keep data
  in `js/data/` and stock logic in `js/stock.js` only.
- **Escape user input before `innerHTML`.** Reviews and checkout details must
  pass through `escapeHtml()` (see `modals.js`, `cart-page.js`,
  `product-display.js`). `showToast()` already escapes its arguments.
- **Auth is simulated.** `login.js` / `register.js` accept any non‑empty input
  and store nothing server‑side. The login/register pages carry a visible
  "Demo only" notice — keep it if you touch those pages.
- External libraries (Bootstrap, Font Awesome, Three.js) load from CDNs. In a
  sandbox that blocks CDN hosts, `three-bg.js` logs "THREE.js is not loaded"
  and degrades gracefully — that is expected, not a bug.

### localStorage keys

`sate_taipan_cart`, `sate_taipan_orders`, `sate_taipan_reviews`,
`sate_taipan_stock`, `sate_taipan_stock_timestamp`, `sate_taipan_seen_intro`
(flags that the "How to Order" onboarding popup has been dismissed). Stock
reseeds to full every 24 hours (`stock.js`), with product id 1 seeded low and
id 3 sold‑out to demo the indicators.

The onboarding popup lives in `js/intro-popup.js` (+ `css/intro.css`) and is
initialized from `menu-page.js`; it auto‑shows on first visit and can be
reopened via the floating "?" button.
