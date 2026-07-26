// Initialize login page functionality
export function initializeLoginPage() {
  console.log("Initializing login page...");
  
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

  // Validate email format
  emailInput?.addEventListener("input", () => {
    const isValid = emailInput.checkValidity();
    emailInput.classList.toggle("is-invalid", !isValid);
  });

  // Handle form submission
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById("remember-me").checked;

    // Basic validation
    if (!email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (!emailInput.checkValidity()) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Logging in...';

      // Simulate API call
      const response = await mockLoginRequest(email, password, rememberMe);

      if (response.success) {
        // Save login state if remember me is checked
        if (rememberMe) {
          localStorage.setItem("userEmail", email);
          localStorage.setItem("isLoggedIn", "true");
        }

        showToast("Login successful! Redirecting...", "success");

        // Redirect to home page after successful login
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      showToast(error.message || "Login failed. Please try again.", "error");
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
  });

  // Check for remembered login
  const rememberedEmail = localStorage.getItem("userEmail");
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    document.getElementById("remember-me").checked = true;
  }
  
  // FIXED: Remove the Facebook login button
  removeFacebookLoginButton();
  
  console.log("Login page initialized successfully");
}

// Function to remove Facebook login button
function removeFacebookLoginButton() {
  try {
    const socialLoginBtns = document.querySelectorAll('.social-btn');
    socialLoginBtns.forEach(btn => {
      // Check if this is the Facebook button
      if (btn.innerHTML.includes('facebook') || 
          btn.innerHTML.includes('Facebook') ||
          btn.querySelector('.fa-facebook') ||
          btn.querySelector('.fa-facebook-f')) {
        btn.remove();
      }
    });
    console.log("Facebook login button removed");
  } catch (e) {
    console.error("Error removing Facebook login button:", e);
  }
}

// Mock login request (replace with actual API call)
function mockLoginRequest(email, password, rememberMe) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // For demo purposes, accept any non-empty email/password
      if (email && password) {
        resolve({ success: true });
      } else {
        reject(new Error("Invalid credentials"));
      }
    }, 1000);
  });
}

// Show toast notification
function showToast(message, type = "info") {
  try {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      console.error("Toast container not found, creating one");
      const newContainer = document.createElement("div");
      newContainer.id = "toast-container";
      newContainer.className = "toast-container";
      document.body.appendChild(newContainer);
      return showToast(message, type); // Try again with the new container
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type} fade-in`;

    const icon = type === "success" ? "check-circle" : "exclamation-circle";
    toast.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  } catch (error) {
    // Fallback to alert if showToast fails
    console.error("Error showing toast:", error);
    alert(message);
  }
}