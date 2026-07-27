/**
 * intro-popup.js — "How to Order" onboarding.
 *
 * Shows an interactive, multi-step popup the first time someone visits, and
 * leaves a floating "?" button so they can reopen it any time. Whether it has
 * been seen is remembered in localStorage.
 */

const SEEN_KEY = "sate_taipan_seen_intro";

const STEPS = [
  {
    icon: "fa-utensils",
    title: "Browse the Menu",
    text: "Filter by Food, Drinks, or Popular, then tap any card to see the details.",
  },
  {
    icon: "fa-pepper-hot",
    title: "Customize Your Satay",
    text: "Adding satay? Pick up to 3 sambals in the popup — some are free, some add a little.",
  },
  {
    icon: "fa-cart-plus",
    title: "Add to Cart",
    text: "Add single items or grab a bundle deal. Keep an eye on the stock badges.",
  },
  {
    icon: "fa-bag-shopping",
    title: "Checkout",
    text: "Open your cart, fill in your delivery details, and place the order. Enjoy!",
  },
];

let overlay = null;
let track = null;
let current = 0;

function render() {
  track.style.transform = `translateX(-${current * 100}%)`;

  overlay.querySelectorAll(".intro-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === current);
    dot.setAttribute("aria-current", i === current ? "true" : "false");
  });

  const back = overlay.querySelector(".intro-back");
  const next = overlay.querySelector(".intro-next");
  back.disabled = current === 0;
  const isLast = current === STEPS.length - 1;
  next.innerHTML = isLast
    ? '<i class="fas fa-check"></i> Start Ordering'
    : 'Next <i class="fas fa-arrow-right"></i>';
}

function goTo(index) {
  current = Math.max(0, Math.min(STEPS.length - 1, index));
  render();
}

function open() {
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  goTo(0);
  overlay.querySelector(".intro-next").focus();
}

function close() {
  overlay.classList.remove("open");
  document.body.style.overflow = "";
  try {
    localStorage.setItem(SEEN_KEY, "true");
  } catch (error) {
    console.error("Could not persist intro-seen flag:", error);
  }
}

function buildDom() {
  overlay = document.createElement("div");
  overlay.className = "intro-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "How to order");

  const steps = STEPS.map(
    (step) => `
      <section class="intro-step">
        <div class="intro-icon"><i class="fas ${step.icon}"></i></div>
        <h3>${step.title}</h3>
        <p>${step.text}</p>
      </section>`
  ).join("");

  const dots = STEPS.map(
    (_, i) => `<button class="intro-dot" type="button" aria-label="Go to step ${i + 1}"></button>`
  ).join("");

  overlay.innerHTML = `
    <div class="intro-card">
      <button class="intro-close" type="button" aria-label="Close">&times;</button>
      <p class="intro-eyebrow">How to Order</p>
      <div class="intro-viewport">
        <div class="intro-track">${steps}</div>
      </div>
      <div class="intro-dots">${dots}</div>
      <div class="intro-actions">
        <button class="intro-btn intro-btn-ghost intro-back" type="button">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="intro-btn intro-btn-primary intro-next" type="button">Next</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  track = overlay.querySelector(".intro-track");

  // Floating re-open button.
  const help = document.createElement("button");
  help.className = "intro-help";
  help.type = "button";
  help.setAttribute("aria-label", "How to order");
  help.innerHTML = '<i class="fas fa-question"></i>';
  document.body.appendChild(help);

  // Wiring
  help.addEventListener("click", open);
  overlay.querySelector(".intro-close").addEventListener("click", close);
  overlay.querySelector(".intro-back").addEventListener("click", () => goTo(current - 1));
  overlay.querySelector(".intro-next").addEventListener("click", () => {
    if (current === STEPS.length - 1) close();
    else goTo(current + 1);
  });
  overlay.querySelectorAll(".intro-dot").forEach((dot, i) => {
    dot.addEventListener("click", () => goTo(i));
  });

  // Close when clicking the backdrop (but not the card).
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  // Keyboard: Esc closes, arrows navigate — only while open.
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") goTo(current + 1);
    else if (e.key === "ArrowLeft") goTo(current - 1);
  });
}

/** Build the popup and show it automatically on a visitor's first visit. */
export function initIntroPopup() {
  if (document.querySelector(".intro-overlay")) return; // guard against double init
  buildDom();

  let seen = false;
  try {
    seen = localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    seen = false;
  }
  if (!seen) setTimeout(open, 600); // let the page settle first
}
