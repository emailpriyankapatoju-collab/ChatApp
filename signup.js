/**
 * Signup Page Logic
 * Creates new user accounts and stores profile in Firestore
 */

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const nameInput = document.getElementById('display-name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const submitBtn = document.getElementById('signup-btn');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const confirmError = document.getElementById('confirm-error');

  // Redirect if already authenticated
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = 'chat.html';
    }
  });

  /**
   * Validate all signup form fields
   * @returns {boolean} Whether the form is valid
   */
  function validateForm() {
    let isValid = true;
    [nameError, emailError, passwordError, confirmError].forEach((el) => {
      el.textContent = '';
    });
    [nameInput, emailInput, passwordInput, confirmInput].forEach((el) => {
      el.classList.remove('error');
    });

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!name) {
      nameError.textContent = 'Display name is required';
      nameInput.classList.add('error');
      isValid = false;
    } else if (name.length < 2) {
      nameError.textContent = 'Name must be at least 2 characters';
      nameInput.classList.add('error');
      isValid = false;
    }

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

    if (!confirm) {
      confirmError.textContent = 'Please confirm your password';
      confirmInput.classList.add('error');
      isValid = false;
    } else if (password !== confirm) {
      confirmError.textContent = 'Passwords do not match';
      confirmInput.classList.add('error');
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
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    };
    return messages[code] || 'Signup failed. Please try again.';
  }

  /**
   * Save user profile document to Firestore
   * @param {object} user - Firebase auth user object
   * @param {string} displayName - User's display name
   */
  async function createUserProfile(user, displayName) {
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      displayName: displayName,
      email: user.email,
      photoURL: user.photoURL || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      online: true,
    });
  }

  // Handle form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const displayName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creating account...';

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName });
      await createUserProfile(userCredential.user, displayName);

      showToast('Account created successfully!');
      window.location.href = 'chat.html';
    } catch (error) {
      showToast(getAuthErrorMessage(error.code), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
});
