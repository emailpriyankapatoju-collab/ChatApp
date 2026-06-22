/**
 * Firebase Configuration
 * Replace the placeholder values with your own Firebase project credentials.
 * Get them from: Firebase Console → Project Settings → Your apps → Web app
 */

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCAIVmoNRUI3-c3zmFcUtJPzwA8-J3q_50",
  authDomain: "chatapp-4d8eb.firebaseapp.com",
  projectId: "chatapp-4d8eb",
  storageBucket: "chatapp-4d8eb.firebasestorage.app",
  messagingSenderId: "1051457910523",
  appId: "1:1051457910523:web:08edf884e91dea10e3a25e",
  measurementId: "G-CTP78RF7BG"
};

// Initialize Firebase
// Initialize Firebase (compat SDK for vanilla JS without bundler)
firebase.initializeApp(firebaseConfig);

// Export service references for use across modules
const auth = firebase.auth();
const db = firebase.firestore();

/**
 * Generate a consistent chat room ID from two user IDs.
 * Sorting ensures the same room ID regardless of who initiates the chat.
 * @param {string} uid1 - First user ID
 * @param {string} uid2 - Second user ID
 * @returns {string} Chat room ID
 */
function getChatRoomId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

/**
 * Show a toast notification message
 * @param {string} message - Text to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type === 'error' ? 'error' : ''} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * Format a Firestore timestamp to a readable time string
 * @param {firebase.firestore.Timestamp} timestamp
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get initials from a display name for avatar placeholders
 * @param {string} name
 * @returns {string} Up to 2 uppercase initials
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
