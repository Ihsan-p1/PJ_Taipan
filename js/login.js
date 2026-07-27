/**
 * login.js — Login page behaviour.
 *
 * Validates the entered credentials against accounts created on the register
 * page (see auth.js), starts a session on success, then returns the user to
 * where they came from (?redirect=) or the home page.
 */

import { showToast } from "./utils.js";
import { loginUser } from "./auth.js";

// Only allow redirects to our own pages — never an arbitrary URL.
const ALLOWED_REDIRECTS = new Set([
  "index.html",
  "cart.html",
  "login.html",
  "register.html",
]);

function safeRedirectTarget() {
  const requested = new URLSearchParams(window.location.search).get("redirect");
  return ALLOWED_REDIRECTS.has(requested) ? requested : "index.html";
}

export function initializeLoginPage() {
  const loginForm = document.getElementById("login-form");
  const togglePasswordBtn = document.querySelector(".toggle-password");
  const passwordInput = document.getElementById("password");
  const emailInput = document.getElementById("email");

  // Toggle password visibility
  togglePasswordBtn?.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePasswordBtn.innerHTML =
      type === "password"
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
  });

  // Live email validity styling
  emailInput?.addEventListener("input", () => {
    emailInput.classList.toggle("is-invalid", !emailInput.checkValidity());
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById("remember-me")?.checked;

    if (!email || !password) {
      showToast("Missing Details", "Please fill in all fields", "error");
      return;
    }
    if (!emailInput.checkValidity()) {
      showToast("Invalid Email", "Please enter a valid email address", "error");
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const resetButton = () => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    };

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

      // Validates against the stored account and starts the session.
      const user = await loginUser({ email, password });

      if (rememberMe) {
        localStorage.setItem("sate_taipan_last_email", email);
      } else {
        localStorage.removeItem("sate_taipan_last_email");
      }

      showToast("Welcome back!", `Signed in as ${user.name}. Redirecting…`);
      setTimeout(() => {
        window.location.href = safeRedirectTarget();
      }, 1200);
    } catch (error) {
      showToast("Login Failed", error.message || "Please try again.", "error");
      resetButton();
    }
  });

  // Prefill the email field if the user asked to be remembered previously.
  const rememberedEmail = localStorage.getItem("sate_taipan_last_email");
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    const rememberCheckbox = document.getElementById("remember-me");
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
}
