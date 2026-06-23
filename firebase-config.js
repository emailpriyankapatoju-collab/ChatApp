/**
 * Firebase Configuration — Compat SDK (no ES modules)
 * Loaded after firebase-app-compat, firebase-auth-compat, firebase-firestore-compat
 */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRJjIsz0R78a0-Bml6OOyo5ZlOxnDjVrc",
  authDomain: "chatapp-2dd06.firebaseapp.com",
  projectId: "chatapp-2dd06",
  storageBucket: "chatapp-2dd06.firebasestorage.app",
  messagingSenderId: "591665732317",
  appId: "1:591665732317:web:15d92b1d688a9bb1c7d934",
  measurementId: "G-KDGG3GYD56"
};



// Initialize Firebase Compat SDK
firebase.initializeApp(firebaseConfig);

// Expose auth and db globally for login.js, signup.js, chat.js
window.auth = firebase.auth();
window.db = firebase.firestore();

/**
 * Generate a consistent chat room ID from two user IDs.
 * @param {string} uid1 - First user ID
 * @param {string} uid2 - Second user ID
 * @returns {string} Chat room ID
 */
window.getChatRoomId = function (uid1, uid2) {
  return [uid1, uid2].sort().join('_');
};

/**
 * Show a toast notification message
 * @param {string} message - Text to display
 * @param {string} type - 'success' or 'error'
 */
window.showToast = function (message, type) {
  type = type || 'success';
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast ' + (type === 'error' ? 'error' : '') + ' show';
  setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
};

/**
 * Format a Firestore timestamp to a readable time string
 * @param {firebase.firestore.Timestamp} timestamp
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
window.formatMessageTime = function (timestamp) {
  if (!timestamp) return '';
  var date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Get initials from a display name for avatar placeholders
 * @param {string} name
 * @returns {string} Up to 2 uppercase initials
 */
window.getInitials = function (name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(function (part) {
      return part[0];
    })
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
