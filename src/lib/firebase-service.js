// ─────────────────────────────────────────────────────────────────────────────
// src/lib/firebase-service.js
//
// Firebase service layer — mirrors every function in mock-store.js.
//
// STATUS: SCAFFOLDED — all functions are stubbed and safe to call; they
// currently delegate to mock-store.  When you activate Firebase (see
// firebase.js), swap each stub body with the real Firestore / Auth code
// shown in the comments above it.
//
// Firestore collections layout:
//   /users/{userId}          — user profile document
//   /deliveries/{deliveryId} — delivery document  (real-time via onSnapshot)
//   /sessions/{userId}       — optional server-side session record
// ─────────────────────────────────────────────────────────────────────────────

// UNCOMMENT_FOR_FIREBASE ↓ ↓ ↓
// import {
//   collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc,
//   query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc
// } from 'firebase/firestore'
// import {
//   createUserWithEmailAndPassword, signInWithEmailAndPassword,
//   signOut as fbSignOut, onAuthStateChanged
// } from 'firebase/auth'
// import { db, auth } from './firebase'

// ── Fallback: re-export everything from mock-store while scaffold is active ───
export {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  updateCurrentUser,
  createDelivery,
  updateDeliveryStatus,
  advanceCourier,
  resetDemo,
  useStore,
  getStore,
  subscribe,
  STATUS_LABEL,
  VEHICLE_TYPES,
} from './mock-store'

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICES
// Replace the mock-store calls below with real Firebase Auth when ready.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FIREBASE IMPLEMENTATION (swap in when ready):
 *
 * export async function fbSignIn(email, password) {
 *   const credential = await signInWithEmailAndPassword(auth, email, password)
 *   return credential.user
 * }
 *
 * export async function fbSignUp(email, password, name, role, details = {}) {
 *   const credential = await createUserWithEmailAndPassword(auth, email, password)
 *   const uid = credential.user.uid
 *   await setDoc(doc(db, 'users', uid), {
 *     id: uid, name, email, role, createdAt: serverTimestamp(), ...details
 *   })
 *   return credential.user
 * }
 *
 * export async function fbSignOut() {
 *   await fbSignOut(auth)
 * }
 *
 * // Real-time auth state listener — use in useRequireAuth hook
 * export function onAuthChange(callback) {
 *   return onAuthStateChanged(auth, callback)
 * }
 */

// ─────────────────────────────────────────────────────────────────────────────
// USER SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FIREBASE IMPLEMENTATION:
 *
 * export async function fbGetUser(userId) {
 *   const snap = await getDoc(doc(db, 'users', userId))
 *   return snap.exists() ? { id: snap.id, ...snap.data() } : null
 * }
 *
 * export async function fbUpdateUser(userId, updates) {
 *   await updateDoc(doc(db, 'users', userId), updates)
 * }
 */

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FIREBASE IMPLEMENTATION:
 *
 * export async function fbCreateDelivery(input) {
 *   const docRef = await addDoc(collection(db, 'deliveries'), {
 *     ...input,
 *     status: 'pending',
 *     createdAt: serverTimestamp(),
 *     statusTimestamps: { pending: serverTimestamp() },
 *   })
 *   return { id: docRef.id, ...input }
 * }
 *
 * export async function fbUpdateDeliveryStatus(deliveryId, status, riderId, riderName) {
 *   await updateDoc(doc(db, 'deliveries', deliveryId), {
 *     status,
 *     ...(riderId ? { riderId, riderName } : {}),
 *     [`statusTimestamps.${status}`]: serverTimestamp(),
 *   })
 * }
 *
 * // Real-time listener for a single delivery (customer Track page)
 * export function subscribeToDelivery(deliveryId, callback) {
 *   return onSnapshot(doc(db, 'deliveries', deliveryId), (snap) => {
 *     if (snap.exists()) callback({ id: snap.id, ...snap.data() })
 *   })
 * }
 *
 * // Real-time listener for all pending deliveries (rider Dashboard)
 * export function subscribeToPendingDeliveries(callback) {
 *   const q = query(
 *     collection(db, 'deliveries'),
 *     where('status', '==', 'pending'),
 *     orderBy('createdAt', 'desc')
 *   )
 *   return onSnapshot(q, (snap) => {
 *     callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
 *   })
 * }
 *
 * // Real-time listener for a rider's own jobs
 * export function subscribeToRiderJobs(riderId, callback) {
 *   const q = query(
 *     collection(db, 'deliveries'),
 *     where('riderId', '==', riderId),
 *     orderBy('createdAt', 'desc')
 *   )
 *   return onSnapshot(q, (snap) => {
 *     callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
 *   })
 * }
 *
 * // Real-time listener for a customer's deliveries
 * export function subscribeToCustomerDeliveries(customerId, callback) {
 *   const q = query(
 *     collection(db, 'deliveries'),
 *     where('customerId', '==', customerId),
 *     orderBy('createdAt', 'desc')
 *   )
 *   return onSnapshot(q, (snap) => {
 *     callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
 *   })
 * }
 *
 * // Update courier GPS position (called frequently — use batched writes in production)
 * export async function fbAdvanceCourier(deliveryId, lat, lng) {
 *   await updateDoc(doc(db, 'deliveries', deliveryId), {
 *     'courierPosition.lat': lat,
 *     'courierPosition.lng': lng,
 *   })
 * }
 */

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS (future — Firebase Cloud Messaging)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FIREBASE IMPLEMENTATION (requires FCM setup):
 *
 * import { getMessaging, getToken, onMessage } from 'firebase/messaging'
 *
 * export async function requestNotificationPermission() {
 *   const messaging = getMessaging()
 *   const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })
 *   // Save token to user doc: fbUpdateUser(userId, { fcmToken: token })
 *   return token
 * }
 *
 * export function onForegroundMessage(callback) {
 *   const messaging = getMessaging()
 *   return onMessage(messaging, callback)
 * }
 */

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE (future — rider profile photos, package images)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FIREBASE IMPLEMENTATION:
 *
 * import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
 * import { storage } from './firebase'
 *
 * export async function uploadProfilePhoto(userId, file) {
 *   const storageRef = ref(storage, `profiles/${userId}/avatar`)
 *   await uploadBytes(storageRef, file)
 *   return getDownloadURL(storageRef)
 * }
 *
 * export async function uploadPackagePhoto(deliveryId, file) {
 *   const storageRef = ref(storage, `deliveries/${deliveryId}/package`)
 *   await uploadBytes(storageRef, file)
 *   return getDownloadURL(storageRef)
 * }
 */
