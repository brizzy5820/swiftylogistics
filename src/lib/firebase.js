// ─────────────────────────────────────────────────────────────────────────────
// src/lib/firebase.js
//
// Firebase initialisation stub.
//
// STATUS: SCAFFOLDED — ready to activate once Firebase project is created.
//
// To activate:
//   1. Run:  npm install firebase
//   2. Create a Firebase project at https://console.firebase.google.com
//   3. Enable:  Authentication (Email/Password)  +  Firestore  +  Storage
//   4. Copy your web app config into .env (see keys below)
//   5. Uncomment all lines marked "UNCOMMENT_FOR_FIREBASE"
//   6. Replace mock-store.js calls with the firebase-service.js equivalents
// ─────────────────────────────────────────────────────────────────────────────

// UNCOMMENT_FOR_FIREBASE ↓ ↓ ↓
// import { initializeApp, getApps }  from 'firebase/app'
// import { getAuth }                 from 'firebase/auth'
// import { getFirestore }            from 'firebase/firestore'
// import { getStorage }              from 'firebase/storage'

// ── Environment variables (add these to your .env file) ──────────────────────
// VITE_FIREBASE_API_KEY=
// VITE_FIREBASE_AUTH_DOMAIN=
// VITE_FIREBASE_PROJECT_ID=
// VITE_FIREBASE_STORAGE_BUCKET=
// VITE_FIREBASE_MESSAGING_SENDER_ID=
// VITE_FIREBASE_APP_ID=

// UNCOMMENT_FOR_FIREBASE ↓ ↓ ↓
// const firebaseConfig = {
//   apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId:             import.meta.env.VITE_FIREBASE_APP_ID,
// }

// Prevent re-initialisation on hot reload
// UNCOMMENT_FOR_FIREBASE ↓ ↓ ↓
// const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

// UNCOMMENT_FOR_FIREBASE ↓ ↓ ↓
// export const auth = getAuth(app)
// export const db   = getFirestore(app)
// export const storage = getStorage(app)

// Placeholder exports so imports don't break during scaffold phase
export const auth    = null
export const db      = null
export const storage = null
