# ChatApp — Real-Time Chat Application

A modern, WhatsApp-inspired real-time chat app built with **HTML**, **CSS**, **JavaScript**, **Firebase Authentication**, and **Cloud Firestore**.

## Folder Structure

```
realtime-chat-app/
├── index.html              # Login page (entry point)
├── signup.html             # Sign up page
├── chat.html               # Main chat interface
├── css/
│   ├── common.css          # Shared variables, reset, utilities
│   ├── auth.css            # Login & signup page styles
│   └── chat.css            # Chat layout, bubbles, sidebar
├── js/
│   ├── firebase-config.js  # Firebase init & shared helpers
│   ├── login.js            # Login form logic
│   ├── signup.js           # Registration logic
│   └── chat.js             # Real-time messaging logic
└── README.md
```

## Features

- Email/password authentication (Firebase Auth)
- User profiles stored in Firestore
- Real-time 1-on-1 messaging
- WhatsApp Web-inspired UI (teal theme, message bubbles)
- User search in sidebar
- Online/offline status
- Responsive mobile layout
- Date separators in chat
- XSS-safe message rendering

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** and follow the steps
3. Once created, click the **Web** icon (`</>`) to register a web app
4. Copy the `firebaseConfig` object

### 2. Configure the App

Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

### 3. Enable Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**

### 4. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **test mode** (for development)
3. Choose a region close to your users

### 5. Firestore Security Rules

Replace default rules with these for production-ready security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User profiles — readable by all authenticated users, writable by owner
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    // Messages — readable/writable by chat participants only
    match /messages/{messageId} {
      allow read: if request.auth != null &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.receiverId == request.auth.uid);
      allow create: if request.auth != null &&
        request.resource.data.senderId == request.auth.uid;
    }
  }
}
```

### 6. Firestore Indexes

When you first load a chat, Firestore may ask you to create a composite index for:

- Collection: `messages`
- Fields: `chatRoomId` (Ascending), `createdAt` (Ascending)

Click the link in the browser console error to auto-create it.

## Run Locally

### Option 1: Live Server (recommended)

Open the folder in VS Code / Cursor → right-click `index.html` → **Open with Live Server**.

### Option 2: Python

```bash
cd d:\Downloads\realtime-chat-app
python -m http.server 8080
```

Visit **http://localhost:8080**

### Option 3: Node.js

```bash
cd d:\Downloads\realtime-chat-app
npx serve .
```

> **Note:** Firebase Auth requires serving over HTTP (not `file://`). Always use a local server.

## How to Test

1. Open the app in **two different browsers** (e.g., Chrome + Firefox) or use incognito mode
2. Sign up with two different accounts in each browser
3. Log in on both — you'll see each other in the user list
4. Click a user to open a chat and send messages in real time

## Firestore Data Structure

```
users/{userId}
  ├── uid: string
  ├── displayName: string
  ├── email: string
  ├── online: boolean
  ├── lastSeen: timestamp
  └── createdAt: timestamp

messages/{messageId}
  ├── text: string
  ├── senderId: string
  ├── senderName: string
  ├── receiverId: string
  ├── chatRoomId: string        // "{uid1}_{uid2}" sorted
  └── createdAt: timestamp
```

## Future Improvements

- Profile photos (Firebase Storage)
- Group chats
- Read receipts and delivery status
- Typing indicators (Firestore presence)
- Image and file sharing
- Push notifications (Firebase Cloud Messaging)
- End-to-end encryption
- Dark mode toggle
- Message reactions and replies
- PWA support for mobile install

## License

Educational / demonstration project.
