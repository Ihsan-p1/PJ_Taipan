/**
 * Phone number validation and formatting
 */

// Function to initialize phone number validation
function initPhoneValidation() {
  const phoneInput = document.getElementById("customer-phone");
  if (!phoneInput) return;

  // Add input event listener to restrict to numbers only
  phoneInput.addEventListener("input", function (e) {
    // Remove any non-digit characters
    let value = e.target.value.replace(/\D/g, "");

    // Format the phone number as user types
    if (value.length > 0) {
      // Indonesian phone format
      if (value.startsWith("0")) {
        // Format: 0812-3456-7890
        if (value.length > 4) {
          value = `${value.substring(0, 4)}-${value.substring(4)}`;
        }
        if (value.length > 9) {
          value = `${value.substring(0, 9)}-${value.substring(9)}`;
        }
        // Limit to 13 digits total (including dashes)
        if (value.length > 14) {
          value = value.substring(0, 14);
        }
      } else if (value.startsWith("62")) {
        // Format: 62-812-3456-7890
        if (value.length > 2) {
          value = `${value.substring(0, 2)}-${value.substring(2)}`;
        }
        if (value.length > 6) {
          value = `${value.substring(0, 6)}-${value.substring(6)}`;
        }
        if (value.length > 11) {
          value = `${value.substring(0, 11)}-${value.substring(11)}`;
        }
        // Limit to 16 digits total (including dashes)
        if (value.length > 16) {
          value = value.substring(0, 16);
        }
      } else if (value.startsWith("8")) {
        // Add country code if user starts with 8
        value = `0${value}`;
        // Reformat
        if (value.length > 4) {
          value = `${value.substring(0, 4)}-${value.substring(4)}`;
        }
        if (value.length > 9) {
          value = `${value.substring(0, 9)}-${value.substring(9)}`;
        }
        // Limit to 13 digits total (including dashes)
        if (value.length > 14) {
          value = value.substring(0, 14);
        }
      } else {
        // Other formats, just add dashes for readability
        if (value.length > 3) {
          value = `${value.substring(0, 3)}-${value.substring(3)}`;
        }
        if (value.length > 7) {
          value = `${value.substring(0, 7)}-${value.substring(7)}`;
        }
      }
    }

    // Update the input value
    e.target.value = value;

    // Update validation state
    validatePhoneNumber(phoneInput);
  });

  // Add blur event for validation feedback
  phoneInput.addEventListener("blur", function () {
    validatePhoneNumber(phoneInput);
  });

  // Add focus event to remove error feedback
  phoneInput.addEventListener("focus", function () {
    phoneInput.classList.remove("is-invalid");
    const errorElement = document.getElementById("phone-error");
    if (errorElement) {
      errorElement.style.display = "none";
    }
  });

  // Create error element if it doesn't exist
  if (!document.getElementById("phone-error")) {
    const errorElement = document.createElement("div");
    errorElement.id = "phone-error";
    errorElement.className = "invalid-feedback";
    errorElement.textContent =
      "Please enter a valid phone number (min 10 digits)";

    // Insert after input
    phoneInput.parentNode.appendChild(errorElement);
  }
}

// Function to validate phone number
function validatePhoneNumber(input) {
  // Get the digits only
  const digitsOnly = input.value.replace(/\D/g, "");

  // Check minimum length (Indonesian phones typically 10-13 digits)
  const isValid = digitsOnly.length >= 10;

  // Show/hide error feedback
  const errorElement = document.getElementById("phone-error");

  if (!isValid) {
    input.classList.add("is-invalid");
    if (errorElement) {
      errorElement.style.display = "block";
    }
  } else {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    if (errorElement) {
      errorElement.style.display = "none";
    }
  }

  return isValid;
}

// Function to validate the entire form
function validateForm(form) {
  let isValid = true;

  // Validate delivery area
  const deliveryArea = form.querySelector(
    'input[name="delivery-area"]:checked'
  );
  const deliveryAreaError = document.getElementById("delivery-area-error");

  if (!deliveryArea) {
    isValid = false;
    if (deliveryAreaError) {
      deliveryAreaError.classList.add("show");
    }
  } else if (deliveryAreaError) {
    deliveryAreaError.classList.remove("show");
  }

  // Validate phone
  const phoneInput = document.getElementById("customer-phone");
  if (phoneInput) {
    if (!validatePhoneNumber(phoneInput)) {
      isValid = false;
    }
  }

  return isValid;
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initPhoneValidation();

  // Override form submission
  const deliveryForm = document.getElementById("delivery-form");
  if (deliveryForm) {
    deliveryForm.addEventListener("submit", function (e) {
      if (!validateForm(deliveryForm)) {
        e.preventDefault();
      }
    });
  }
});
