/* ============================================================
   AUTHENTICATION MODULE
   Handles: signup, login, logout, Google sign-in, password reset,
   route protection, and user document creation in Firestore.
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ---------- Public helpers ---------- */

export async function signUp(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await ensureUserDoc(cred.user, { name });
  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(cred.user);
  return cred.user;
}

export async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDoc(cred.user, { name: cred.user.displayName });
  return cred.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  await signOut(auth);
  window.location.href = "login.html";
}

/* ---------- Listen to auth state ---------- */

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ---------- Route guards ---------- */

/** Redirect to login if user is NOT signed in. Use on dashboard/generator. */
export function requireAuth(redirectTo = "login.html") {
  return new Promise(resolve => {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.href = redirectTo + "?next=" + encodeURIComponent(location.pathname);
      } else {
        resolve(user);
      }
    });
  });
}

/** Redirect away if user IS signed in (use on login/register). */
export function redirectIfAuthed(target = "dashboard.html") {
  onAuthStateChanged(auth, user => {
    if (user) {
      const params = new URLSearchParams(location.search);
      window.location.href = params.get("next") || target;
    }
  });
}

/* ---------- User document bootstrap ---------- */

const DEFAULT_DAILY_CREDITS = 5;

export async function ensureUserDoc(user, extra = {}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      name: extra.name || user.displayName || "Creator",
      photoURL: user.photoURL || null,
      plan: "free",
      credits: DEFAULT_DAILY_CREDITS,
      creditsResetDate: new Date().toDateString(),
      totalGenerations: 0,
      createdAt: serverTimestamp()
    });
  } else {
    // Daily credit reset for free plan
    const data = snap.data();
    if (data.plan === "free" && data.creditsResetDate !== new Date().toDateString()) {
      await setDoc(ref, {
        credits: DEFAULT_DAILY_CREDITS,
        creditsResetDate: new Date().toDateString()
      }, { merge: true });
    }
  }
}

/* ---------- Friendly error messages ---------- */

export function friendlyError(err) {
  const code = err?.code || "";
  const map = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error. Check your connection."
  };
  return map[code] || err?.message || "Something went wrong. Please try again.";
}
