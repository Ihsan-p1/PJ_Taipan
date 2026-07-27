/**
 * auth.js — Simulated account system (single source of truth for auth).
 *
 * This is a front-end demo: "accounts" live in localStorage. There is no
 * server. But unlike a pure mockup, this actually behaves like an auth system:
 *
 *   - Register persists a user record (email, name, salted password hash).
 *   - Login validates the password against that stored record.
 *   - A session is kept in localStorage and the navbar reacts to it
 *     (shows the user's name + a working Logout button).
 *   - Checkout is gated on being logged in.
 *
 * Passwords are never stored in plain text — they are hashed with SHA-256 and
 * a per-user random salt via the Web Crypto API. This is still NOT production
 * security (no server, no rate limiting, salt is stored beside the hash), but
 * it avoids modelling an outright bad practice.
 */

const USERS_KEY = "sate_taipan_users";
const SESSION_KEY = "sate_taipan_session";

/* ------------------------------------------------------------------ */
/* Storage helpers                                                     */
/* ------------------------------------------------------------------ */

function getUsers() {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ------------------------------------------------------------------ */
/* Password hashing                                                    */
/* ------------------------------------------------------------------ */

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  // Web Crypto is available in secure contexts (https + http://localhost).
  if (crypto?.subtle?.digest) {
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }
  // Fallback for non-secure contexts (e.g. file://) — demo only.
  let hash = 0;
  for (const char of `${salt}:${password}`) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return `fallback_${(hash >>> 0).toString(16)}`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Find a stored user by email (case-insensitive), or undefined. */
export function findUser(email) {
  const target = String(email).trim().toLowerCase();
  return getUsers().find((user) => user.email.toLowerCase() === target);
}

/**
 * Create a new account. Throws if the email is already registered.
 * @returns {Promise<{email:string, name:string}>}
 */
export async function registerUser({ email, password, name }) {
  const cleanEmail = String(email).trim();
  if (findUser(cleanEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);

  const users = getUsers();
  users.push({
    email: cleanEmail,
    name: String(name || "").trim() || cleanEmail.split("@")[0],
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  saveUsers(users);

  return { email: cleanEmail, name };
}

/**
 * Validate credentials and start a session.
 * Throws if the account is unknown or the password is wrong.
 * @returns {Promise<{email:string, name:string}>}
 */
export async function loginUser({ email, password }) {
  const user = findUser(email);
  if (!user) {
    throw new Error("No account found with this email. Please register first.");
  }

  const attempt = await hashPassword(password, user.salt);
  if (attempt !== user.passwordHash) {
    throw new Error("Incorrect password. Please try again.");
  }

  setSession({ email: user.email, name: user.name });
  return { email: user.email, name: user.name };
}

/** Persist the current session. */
export function setSession(session) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, loggedInAt: Date.now() })
  );
}

/** The current session object, or null. */
export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

/** End the current session. */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** True when someone is logged in. */
export function isLoggedIn() {
  return !!getSession();
}

/* ------------------------------------------------------------------ */
/* Navbar auth control                                                 */
/* ------------------------------------------------------------------ */

/**
 * Render the auth control into the navbar's `#nav-auth` slot and keep it in
 * sync with the session. Shows a Login link when logged out, and the user's
 * name + a working Logout button when logged in.
 */
export function initNavAuth() {
  const slot = document.getElementById("nav-auth");
  if (!slot) return;

  const render = () => {
    const session = getSession();
    if (session) {
      slot.innerHTML = `
        <span class="user-chip" title="Signed in as ${escapeAttr(session.email)}">
          <i class="fas fa-user-circle"></i>
          <span class="user-chip-name">${escapeAttr(session.name)}</span>
        </span>
        <button type="button" class="btn-outline-light" id="logout-btn">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      `;
      const logoutBtn = slot.querySelector("#logout-btn");
      logoutBtn?.addEventListener("click", () => {
        clearSession();
        render();
        try {
          document.dispatchEvent(new CustomEvent("auth:changed"));
        } catch {
          /* CustomEvent unsupported — safe to ignore */
        }
      });
    } else {
      slot.innerHTML = `
        <a href="login.html" class="btn-outline-light">
          <i class="fas fa-sign-in-alt"></i> Login
        </a>
      `;
    }
  };

  render();
  // Keep multiple tabs / other scripts in sync.
  window.addEventListener("storage", (event) => {
    if (event.key === SESSION_KEY) render();
  });
}

// Small helper so names/emails can't break out of the attribute/markup above.
function escapeAttr(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}
