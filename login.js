/**
 * Login Page Logic
 * Handles email/password authentication via Firebase Auth
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('login-btn');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  // Redirect to chat if user is already logged in
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = 'chat.html';
    }
  });

  /**
   * Validate form fields before submission
   * @returns {boolean} Whether the form is valid
   */
  function validateForm() {
    let isValid = true;
    emailError.textContent = '';
    passwordError.textContent = '';
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      emailError.textContent = 'Email is required';
      emailInput.classList.add('error');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Enter a valid email address';
      emailInput.classList.add('error');
      isValid = false;
    }

    if (!password) {
      passwordError.textContent = 'Password is required';
      passwordInput.classList.add('error');
      isValid = false;
    } else if (password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters';
      passwordInput.classList.add('error');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Map Firebase auth error codes to user-friendly messages
   * @param {string} code - Firebase error code
   * @returns {string} Human-readable error message
   */
  function getAuthErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    return messages[code] || 'Login failed. Please try again.';
  }

  // Handle form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showToast('Welcome back!');
      window.location.href = 'chat.html';
    } catch (error) {
      showToast(getAuthErrorMessage(error.code), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
});
