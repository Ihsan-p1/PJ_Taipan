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

There is nothing to build. Unit tests for the pure logic run on Node's
built-in runner with **no dependencies and no `package.json`** — keep it that
way (don't introduce Vitest/Jest/jsdom):

```bash
node --test test/*.test.mjs   # test/_setup.mjs stubs localStorage/document
```

CI (`.github/workflows/ci.yml`) runs these on every push/PR; the site
auto-deploys to GitHub Pages (`.github/workflows/deploy-pages.yml`) on push to
`main`. No linter is configured.

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
- `js/auth.js` — **the only** auth service: register/login/session,
  password hashing, and the navbar auth control (`initNavAuth`). Leaf module
  (no internal imports).
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
- **Auth is client‑side but real.** `js/auth.js` is the **only** auth service:
  `register.js` persists an account to the `sate_taipan_users` key (password is
  SHA‑256‑hashed with a per‑user salt), `login.js` validates against it and
  starts a session (`sate_taipan_session`), and `initNavAuth()` renders the
  Login link / signed‑in chip + Logout in the navbar's `#nav-auth` slot.
  Checkout (`cart-page.js`) is gated on `isLoggedIn()`. There is no server, so
  this is **not secure** — keep the "Demo only" notices on the auth pages, and
  never present it as production auth.
- External libraries (Bootstrap, Font Awesome, Three.js) load from CDNs. In a
  sandbox that blocks CDN hosts, `three-bg.js` logs "THREE.js is not loaded"
  and degrades gracefully — that is expected, not a bug.

### localStorage keys

`sate_taipan_cart`, `sate_taipan_orders`, `sate_taipan_reviews`,
`sate_taipan_stock`, `sate_taipan_stock_timestamp`, `sate_taipan_seen_intro`
(flags that the "How to Order" onboarding popup has been dismissed),
`sate_taipan_users` (registered accounts), `sate_taipan_session` (current
login). Stock reseeds to full every 24 hours (`stock.js`) — the reset
timestamp is stamped only on reseed, not on every write — with product id 1
seeded low and id 3 sold‑out to demo the indicators.

The onboarding popup lives in `js/intro-popup.js` (+ `css/intro.css`) and is
initialized from `menu-page.js`; it auto‑shows on first visit and can be
reopened via the floating "?" button.
