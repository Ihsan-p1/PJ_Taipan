import { registerUser } from "./auth.js";

// Initialize register page functionality
export function initializeRegisterPage() {
  const registerForm = document.getElementById("register-form");
  const steps = document.querySelectorAll(".step");
  const formSteps = document.querySelectorAll(".form-step");
  const nextBtn = document.getElementById("next-step");
  const prevBtn = document.getElementById("prev-step");
  const submitBtn = document.getElementById("submit-registration");
  let currentStep = 1;

  // Password strength checker
  const passwordInput = document.getElementById("password");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");

  // Toggle password visibility
  const togglePasswordBtn = document.querySelector(".toggle-password");
  togglePasswordBtn?.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePasswordBtn.innerHTML =
      type === "password"
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
  });

  // Check password strength
  passwordInput?.addEventListener("input", () => {
    const strength = checkPasswordStrength(passwordInput.value);
    updatePasswordStrength(strength);
  });

  // Handle verification code inputs
  const codeInputs = document.querySelectorAll(".code-input");
  codeInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      if (e.target.value.length === 1 && index < codeInputs.length - 1) {
        codeInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        codeInputs[index - 1].focus();
      }
    });
  });

  // Navigation between steps
  nextBtn?.addEventListener("click", () => {
    if (validateCurrentStep()) {
      currentStep++;
      updateFormStep();
    }
  });

  prevBtn?.addEventListener("click", () => {
    currentStep--;
    updateFormStep();
  });

  // Form submission
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

        // Collect form data
        const formData = {
          email: document.getElementById("email").value,
          password: passwordInput.value,
          firstName: document.getElementById("first-name").value,
          lastName: document.getElementById("last-name").value,
          phone: document.getElementById("phone").value,
          address: document.getElementById("address").value,
          verificationCode: Array.from(codeInputs)
            .map((input) => input.value)
            .join(""),
        };

        // Persist the account so it can actually be used to log in.
        await registerUser({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
        });

        showToast(
          "Registration successful! Redirecting to login...",
          "success"
        );

        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } catch (error) {
        showToast(
          error.message || "Registration failed. Please try again.",
          "error"
        );
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<i class="fas fa-check"></i> Complete Registration';
      }
    }
  });

  // Update form step display
  function updateFormStep() {
    formSteps.forEach((step) => (step.style.display = "none"));
    formSteps[currentStep - 1].style.display = "block";

    steps.forEach((step, index) => {
      step.classList.toggle("active", index + 1 === currentStep);
      step.classList.toggle("completed", index + 1 < currentStep);
    });

    prevBtn.style.display = currentStep === 1 ? "none" : "block";
    nextBtn.style.display = currentStep === 3 ? "none" : "block";
    submitBtn.style.display = currentStep === 3 ? "block" : "none";
  }

  // Initialize terms and privacy functionality
  initializeTermsAndPrivacy();

  // Update form validation to check for terms acceptance
  function validateCurrentStep() {
    switch (currentStep) {
      case 1:
        return validateAccountStep();
      case 2:
        return validateProfileStep();
      case 3:
        const termsChecked = document.getElementById('terms').checked;
        if (!termsChecked) {
          showToast('Please accept the Terms & Conditions and Privacy Policy', 'error');
          return false;
        }
        return validateVerificationStep();
      default:
        return false;
    }
  }

  // Step-specific validation
  function validateAccountStep() {
    const email = document.getElementById("email").value;
    const password = passwordInput.value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!email || !password || !confirmPassword) {
      showToast("Please fill in all fields", "error");
      return false;
    }

    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address", "error");
      return false;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return false;
    }

    if (checkPasswordStrength(password).score < 2) {
      showToast("Please choose a stronger password", "error");
      return false;
    }

    return true;
  }

  function validateProfileStep() {
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const phone = document.getElementById("phone").value;

    if (!firstName || !lastName || !phone) {
      showToast("Please fill in all required fields", "error");
      return false;
    }

    if (!isValidPhone(phone)) {
      showToast("Please enter a valid phone number", "error");
      return false;
    }

    return true;
  }

  function validateVerificationStep() {
    const code = Array.from(codeInputs)
      .map((input) => input.value)
      .join("");

    if (code.length !== 6) {
      showToast("Please enter the complete verification code", "error");
      return false;
    }

    return true;
  }

  // Helper functions
  function checkPasswordStrength(password) {
    let score = 0;
    let feedback = "";

    if (password.length >= 8) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^A-Za-z0-9]/)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = "Weak";
        strengthBar.style.width = "20%";
        strengthBar.style.backgroundColor = "#ff4757";
        break;
      case 2:
        feedback = "Fair";
        strengthBar.style.width = "40%";
        strengthBar.style.backgroundColor = "#ffa502";
        break;
      case 3:
        feedback = "Good";
        strengthBar.style.width = "60%";
        strengthBar.style.backgroundColor = "#2ed573";
        break;
      case 4:
        feedback = "Strong";
        strengthBar.style.width = "80%";
        strengthBar.style.backgroundColor = "#2ed573";
        break;
      case 5:
        feedback = "Very Strong";
        strengthBar.style.width = "100%";
        strengthBar.style.backgroundColor = "#2ed573";
        break;
    }

    return { score, feedback };
  }

  function updatePasswordStrength(strength) {
    strengthText.textContent = `Password strength: ${strength.feedback}`;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[0-9]{10,}$/.test(phone.replace(/[^0-9]/g, ""));
  }

  // Show toast notification
  function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type} fade-in`;

    const icon = type === "success" ? "check-circle" : "exclamation-circle";
    toast.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

function initializeTermsAndPrivacy() {
  const termsCheckbox = document.getElementById('terms');
  let termsAccepted = false;
  let privacyAccepted = false;

  // Get modal elements
  const termsModal = document.getElementById('termsModal');
  const privacyModal = document.getElementById('privacyModal');
  const acceptTermsBtn = document.getElementById('acceptTerms');
  const acceptPrivacyBtn = document.getElementById('acceptPrivacy');

  // Handle Terms acceptance
  acceptTermsBtn?.addEventListener('click', () => {
    termsAccepted = true;
    updateCheckboxState();
    bootstrap.Modal.getInstance(termsModal).hide();
    showToast('Terms & Conditions accepted', 'success');
  });

  // Handle Privacy acceptance
  acceptPrivacyBtn?.addEventListener('click', () => {
    privacyAccepted = true;
    updateCheckboxState();
    bootstrap.Modal.getInstance(privacyModal).hide();
    showToast('Privacy Policy accepted', 'success');
  });

  // Update checkbox state
  function updateCheckboxState() {
    if (termsAccepted && privacyAccepted) {
      termsCheckbox.checked = true;
      termsCheckbox.dispatchEvent(new Event('change'));
    }
  }

  // Handle checkbox click
  termsCheckbox?.addEventListener('click', (e) => {
    if (!termsAccepted || !privacyAccepted) {
      e.preventDefault();
      showToast('Please read and accept both Terms & Privacy Policy', 'error');
      const termsModalInstance = new bootstrap.Modal(termsModal);
      termsModalInstance.show();
    }
  });

  // Reset acceptance state when modals are closed
  termsModal?.addEventListener('hidden.bs.modal', () => {
    if (!termsAccepted) {
      termsCheckbox.checked = false;
    }
  });

  privacyModal?.addEventListener('hidden.bs.modal', () => {
    if (!privacyAccepted) {
      termsCheckbox.checked = false;
    }
  });
}
