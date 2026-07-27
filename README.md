# Sate Taipan — Storefront Demo

> 🎓 **Final project (tugas akhir) — bidang Penjualan.** This is my final
> project in the sales field: a complete web‑based online‑ordering storefront
> for a fictional Indonesian satay stall, built to demonstrate an end‑to‑end
> F&B selling flow — browse → customize → cart → checkout — as a modern
> commerce website.

A responsive, client‑side storefront for a fictional Indonesian satay stall
(_sate taichan_ + herbal teas). Built with vanilla **HTML, CSS, and ES‑module
JavaScript** — no build step, no framework, no backend.

> ⚠️ **This is a front‑end demo.** There is no server. Accounts, cart, orders,
> reviews, and stock all live in your browser's `localStorage` — auth is real
> enough to log in and out, but it is client‑side only and not secure. See
> [Limitations](#limitations).

## Live demo

Not deployed yet. The site is fully static and ships with a ready‑to‑run
GitHub Pages workflow
([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)),
so it can go live whenever you want:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Actions tab → **Deploy to GitHub Pages** → **Run workflow**.

Once deployed it is served at `https://<user>.github.io/PJ_Taipan/`.

## Features

- **Product grid** with category filters (All / Food / Drinks / Popular)
- **Bundle deals** (couple / family / party) with combined pricing
- **Sauce customization** modal for food items
- **Ratings & reviews** stored per product
- **Stock indicators** — low‑stock warnings and sold‑out states, resetting
  every 24 hours
- **Account registration & login** — multi‑step sign‑up with a live
  password‑strength meter; credentials are validated on login (passwords are
  SHA‑256 hashed with a per‑user salt), the navbar reflects the signed‑in user,
  and **checkout is gated on being logged in**
- **Cart / checkout** flow with delivery details prefilled from your account
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

## Tests

The pure logic (`auth`, `stock`, `cart-manager`, bundle resolution) is covered
by unit tests that run on **Node's built‑in test runner** — no `package.json`,
no dependencies, no build step, in keeping with the rest of the project:

```bash
node --test test/*.test.mjs
```

These run automatically on every push and pull request via
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

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
| `sate_taipan_seen_intro`     | "How to Order" popup dismissed  |
| `sate_taipan_users`          | Registered accounts (salted hash)|
| `sate_taipan_session`        | Current logged‑in session       |

## Limitations

This is a portfolio demo, and it is honest about it:

- **Client‑side auth only.** Registration and login really work — accounts are
  stored in `localStorage` and passwords are hashed (SHA‑256 + per‑user salt) —
  but there is no server, so this is **not secure**: the "database" is the
  visitor's own browser, anyone can read it, and there is no rate limiting or
  session expiry. Treat it as a UX demonstration of an auth flow, not real
  security.
- **No backend / database.** All state is in `localStorage` and is per‑browser.
- **Not production‑hardened.** See below.

## Possible next steps

- Add **Subresource Integrity (SRI)** hashes to the CDN `<script>`/`<link>`
  tags for supply‑chain hardening.
- Move the client‑side auth to a real backend (or a service like Firebase) so
  credentials are validated and stored server‑side.

## License

[MIT](./LICENSE)
