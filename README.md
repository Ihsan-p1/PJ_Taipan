# Sate Taipan — Storefront Demo

A responsive, client‑side storefront for a fictional Indonesian satay stall
(_sate taichan_ + herbal teas). Built with vanilla **HTML, CSS, and ES‑module
JavaScript** — no build step, no framework, no backend.

> ⚠️ **This is a front‑end demo.** There is no server. Authentication is
> simulated, and the cart, orders, reviews, and stock all live in your
> browser's `localStorage`. See [Limitations](#limitations).

## Live demo

Because the project is fully static, it can be hosted on **GitHub Pages**:

1. Push to `main`.
2. Repo → **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch**, branch: `main`, folder: `/ (root)`.
4. Open the published URL.

## Features

- **Product grid** with category filters (All / Food / Drinks / Popular)
- **Bundle deals** (couple / family / party) with combined pricing
- **Sauce customization** modal for food items
- **Ratings & reviews** stored per product
- **Stock indicators** — low‑stock warnings and sold‑out states, resetting
  every 24 hours
- **Multi‑step registration** with a live password‑strength meter
- **Simulated login** and **cart / checkout** flow
- Animated 3D background (Three.js, loaded from CDN)

## Tech stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Markup     | HTML5, semantic sections                           |
| Styling    | Custom CSS (per‑component files) + Bootstrap 5.3   |
| Scripting  | Vanilla JavaScript, native ES modules              |
| Icons/Font | Font Awesome 6, Google Fonts (Poppins)             |
| 3D         | Three.js r128                                      |
| Storage    | Browser `localStorage`                             |

External libraries are loaded from CDNs.

## Running locally

ES modules require `http://` (they don't work when opening the file directly),
so serve the folder with any static server:

```bash
# Python 3
python3 -m http.server 8000
# then open http://localhost:8000
```

```bash
# or Node
npx serve .
```

## Project structure

```
.
├── index.html          # Menu / storefront
├── cart.html           # Cart & checkout
├── login.html          # Simulated login
├── register.html       # Multi-step registration
├── css/                # One stylesheet per concern
├── images/             # Product photos & logo
└── js/
    ├── data/
    │   └── products.js  # Single source of truth for the catalog
    ├── utils.js         # Cart storage, formatting, toasts, HTML escaping
    ├── stock.js         # Single stock service (read/decrement/render)
    ├── cart-manager.js  # Add / update / remove cart items (enforces stock)
    ├── product-display.js
    ├── bundle-display.js
    ├── modals.js        # Sauce customization + rating modals
    ├── three-bg.js      # Animated 3D background
    ├── ui-enhancements.js
    ├── form-number-validation.js
    ├── menu-page.js     # Entry point for index.html
    ├── cart-page.js     # Entry point for cart.html
    ├── login.js
    └── register.js
```

Each HTML page loads a **single ES‑module entry point** (`menu-page.js`,
`cart-page.js`, etc.); everything else is imported from there.

## Architecture notes

- **One source of truth per concern.** The catalog lives only in
  `js/data/products.js`; stock logic lives only in `js/stock.js`. Nothing is
  duplicated across files.
- **Stock is enforced in one place.** `cart-manager.addToCart()` reserves stock
  through `stock.js` before adding an item — no runtime function patching.
- **User input is escaped.** Review names/text and checkout details pass
  through `escapeHtml()` before being inserted into the DOM.

### localStorage keys

| Key                          | Purpose                         |
| ---------------------------- | ------------------------------- |
| `sate_taipan_cart`           | Current cart items              |
| `sate_taipan_orders`         | Placed orders                   |
| `sate_taipan_reviews`        | Product reviews                 |
| `sate_taipan_stock`          | Remaining stock per product     |
| `sate_taipan_stock_timestamp`| Last stock reset time           |

## Limitations

This is a portfolio demo, and it is honest about it:

- **No authentication.** Login/registration are simulated in the browser; any
  non‑empty input "succeeds." No credentials are ever transmitted or stored
  securely.
- **No backend / database.** All state is in `localStorage` and is per‑browser.
- **Not production‑hardened.** See below.

## Possible next steps

- Add **Subresource Integrity (SRI)** hashes to the CDN `<script>`/`<link>`
  tags for supply‑chain hardening.
- Replace the simulated auth with a real backend (or a service like Firebase).
- Add automated tests for `cart-manager` and `stock` (e.g. Vitest) and a CI
  workflow.

## License

[MIT](./LICENSE)
