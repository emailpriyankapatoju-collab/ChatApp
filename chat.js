/**
 * Chat Page Logic
 * Real-time messaging with Firebase Firestore
 * WhatsApp-style UI with user list and message bubbles
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- DOM Elements ---------- */
  const loadingOverlay = document.getElementById('loading-overlay');
  const currentUserAvatar = document.getElementById('current-user-avatar');
  const currentUserName = document.getElementById('current-user-name');
  const userList = document.getElementById('user-list');
  const userSearch = document.getElementById('user-search');
  const chatEmpty = document.getElementById('chat-empty');
  const chatView = document.getElementById('chat-view');
  const chatHeaderName = document.getElementById('chat-header-name');
  const chatHeaderStatus = document.getElementById('chat-header-status');
  const chatHeaderAvatar = document.getElementById('chat-header-avatar');
  const messagesContainer = document.getElementById('messages-container');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const backBtn = document.getElementById('back-btn');
  const chatSidebar = document.getElementById('chat-sidebar');

  /* ---------- State ---------- */
  let currentUser = null;
  let selectedUser = null;
  let messagesUnsubscribe = null;
  let usersUnsubscribe = null;
  let allUsers = [];

  /* ============================================================
     Authentication Guard
     Redirect to login if not authenticated
     ============================================================ */
  window.auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    currentUser = user;
    const displayName = user.displayName || user.email.split('@')[0];

    // Update sidebar with current user info
    currentUserName.textContent = displayName;
    currentUserAvatar.textContent = window.getInitials(displayName);

    // Mark user as online in Firestore
    await updateUserPresence(true);

    // Load all registered users
    listenToUsers();

    // Hide loading overlay
    loadingOverlay.classList.add('hidden');
  });

  /**
   * Update user's online status and last seen timestamp
   * @param {boolean} online - Whether user is currently online
   */
  async function updateUserPresence(online) {
    if (!currentUser) return;
    await window.db.collection('users').doc(currentUser.uid).set(
      {
        online,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Set offline when user closes tab
  window.addEventListener('beforeunload', () => {
    if (currentUser) {
      updateUserPresence(false);
    }
  });

  /* ============================================================
     User List — Real-time listener for all registered users
     ============================================================ */
  function listenToUsers() {
    usersUnsubscribe = window.db
      .collection('users')
      .orderBy('displayName')
      .onSnapshot((snapshot) => {
        allUsers = [];
        snapshot.forEach((doc) => {
          const userData = doc.data();
          // Exclude current user from the list
          if (userData.uid !== currentUser.uid) {
            allUsers.push(userData);
          }
        });
        renderUserList(allUsers);
      });
  }

  /**
   * Render the sidebar user list
   * @param {Array} users - Array of user objects
   */
  function renderUserList(users) {
    if (users.length === 0) {
      userList.innerHTML = `
        <li class="empty-users">
          No other users yet.<br>
          Ask a friend to sign up!
        </li>`;
      return;
    }

    userList.innerHTML = users
      .map(
        (user) => `
      <li class="user-list-item ${selectedUser?.uid === user.uid ? 'active' : ''}"
          data-uid="${user.uid}"
          role="button"
          tabindex="0"
          aria-label="Chat with ${user.displayName}">
        <div class="avatar">${window.getInitials(user.displayName)}</div>
        <div class="user-details">
          <h3>${escapeHtml(user.displayName)}</h3>
          <p class="last-message">${user.online ? 'Online' : 'Offline'}</p>
        </div>
      </li>`
      )
      .join('');

    // Attach click handlers to user items
    userList.querySelectorAll('.user-list-item').forEach((item) => {
      item.addEventListener('click', () => selectUser(item.dataset.uid));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectUser(item.dataset.uid);
        }
      });
    });
  }

  /**
   * Filter users by search query
   */
  userSearch.addEventListener('input', () => {
    const query = userSearch.value.toLowerCase().trim();
    const filtered = allUsers.filter(
      (u) =>
        u.displayName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
    renderUserList(filtered);
  });

  /* ============================================================
     Chat Selection & Real-time Messages
     ============================================================ */

  /**
   * Select a user to chat with and load their messages
   * @param {string} uid - Selected user's Firebase UID
   */
  function selectUser(uid) {
    selectedUser = allUsers.find((u) => u.uid === uid);
    if (!selectedUser) return;

    // Update UI
    chatEmpty.classList.add('hidden');
    chatView.classList.remove('hidden');
    chatHeaderName.textContent = selectedUser.displayName;
    chatHeaderStatus.textContent = selectedUser.online ? 'Online' : 'Offline';
    chatHeaderAvatar.textContent = window.getInitials(selectedUser.displayName);

    // Highlight active user in sidebar
    userList.querySelectorAll('.user-list-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.uid === uid);
    });

    // Mobile: hide sidebar, show chat
    if (window.innerWidth <= 768) {
      chatSidebar.classList.add('hidden-mobile');
    }

    // Load real-time messages for this conversation
    loadMessages();

    messageInput.focus();
  }

  /**
   * Subscribe to real-time messages for the current chat room
   */
  function loadMessages() {
    // Unsubscribe from previous chat listener
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }

    const chatRoomId = window.getChatRoomId(currentUser.uid, selectedUser.uid);
    messagesContainer.innerHTML = '';

    messagesUnsubscribe = window.db
      .collection('messages')
      .where('chatRoomId', '==', chatRoomId)
      .orderBy('createdAt', 'asc')
      .onSnapshot((snapshot) => {
        messagesContainer.innerHTML = '';
        let lastDate = null;

        snapshot.forEach((doc) => {
          const msg = doc.data();
          const msgDate = msg.createdAt?.toDate?.();
          const dateStr = msgDate ? msgDate.toDateString() : null;

          // Insert date separator when day changes
          if (dateStr && dateStr !== lastDate) {
            messagesContainer.appendChild(createDateSeparator(msgDate));
            lastDate = dateStr;
          }

          messagesContainer.appendChild(createMessageElement(msg));
        });

        // Auto-scroll to latest message
        scrollToBottom();
      });
  }

  /**
   * Create a date separator element
   * @param {Date} date
   * @returns {HTMLElement}
   */
  function createDateSeparator(date) {
    const el = document.createElement('div');
    el.className = 'date-separator';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      el.textContent = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      el.textContent = 'Yesterday';
    } else {
      el.textContent = date.toLocaleDateString([], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return el;
  }

  /**
   * Create a message bubble DOM element
   * @param {object} msg - Message data from Firestore
   * @returns {HTMLElement}
   */
  function createMessageElement(msg) {
    const isSent = msg.senderId === currentUser.uid;
    const div = document.createElement('div');
    div.className = `message ${isSent ? 'sent' : 'received'}`;

    div.innerHTML = `
      <div class="message-bubble">
        ${!isSent ? `<div class="message-sender">${escapeHtml(msg.senderName)}</div>` : ''}
        <div class="message-text">${escapeHtml(msg.text)}</div>
        <div class="message-meta">
          <span class="message-time">${window.formatMessageTime(msg.createdAt)}</span>
        </div>
      </div>`;

    return div;
  }

  /**
   * Scroll messages container to the bottom
   */
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /* ============================================================
     Send Message
     ============================================================ */
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();
    if (!text || !selectedUser) return;

    sendBtn.disabled = true;
    messageInput.disabled = true;

    try {
      const chatRoomId = window.getChatRoomId(currentUser.uid, selectedUser.uid);

      await window.db.collection('messages').add({
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email.split('@')[0],
        receiverId: selectedUser.uid,
        chatRoomId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      messageInput.value = '';
    } catch (error) {
      window.showToast('Failed to send message. Try again.', 'error');
      console.error('Send error:', error);
    } finally {
      sendBtn.disabled = false;
      messageInput.disabled = false;
      messageInput.focus();
    }
  });

  // Enable send on Enter key (Shift+Enter for new line not needed for input)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      messageForm.dispatchEvent(new Event('submit'));
    }
  });

  /* ============================================================
     Logout
     ============================================================ */
  logoutBtn.addEventListener('click', async () => {
    try {
      await updateUserPresence(false);
      if (messagesUnsubscribe) messagesUnsubscribe();
      if (usersUnsubscribe) usersUnsubscribe();
      await window.auth.signOut();
      window.location.href = 'index.html';
    } catch (error) {
      window.showToast('Logout failed. Try again.', 'error');
    }
  });

  /* ============================================================
     Mobile Navigation — Back button
     ============================================================ */
  backBtn.addEventListener('click', () => {
    chatSidebar.classList.remove('hidden-mobile');
    chatView.classList.add('hidden');
    chatEmpty.classList.remove('hidden');
    selectedUser = null;
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
      messagesUnsubscribe = null;
    }
  });

  /* ============================================================
     Utility — Escape HTML to prevent XSS
     ============================================================ */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
