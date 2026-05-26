/* ============================================================
   USER DATA SERVICE
   Reads/writes credits, generation history, and favorites
   from Firestore. All functions require an authenticated user.
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function uid() {
  if (!auth.currentUser) throw new Error("Not signed in");
  return auth.currentUser.uid;
}

async function ensureUserDocExists() {
  const ref = doc(db, "users", uid());
  const snap = await getDoc(ref);
  if (snap.exists()) return ref;

  const user = auth.currentUser;
  await setDoc(ref, {
    uid: user.uid,
    email: user.email || null,
    name: user.displayName || "Creator",
    photoURL: user.photoURL || null,
    plan: "free",
    credits: 5,
    creditsResetDate: new Date().toDateString(),
    totalGenerations: 0,
    createdAt: serverTimestamp()
  });
  return ref;
}

/* ---------- USER PROFILE ---------- */

export async function getUserProfile() {
  const ref = doc(db, "users", uid());
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function getCredits() {
  const profile = await getUserProfile();
  return profile?.credits ?? 0;
}

/** Atomically use 1 credit. Returns true if successful, false if no credits. */
export async function useOneCredit() {
  const ref = doc(db, "users", uid());
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) return false;
  if (data.plan === "pro") return true; // unlimited
  if (data.credits <= 0) return false;
  await updateDoc(ref, {
    credits: increment(-1),
    totalGenerations: increment(1)
  });
  return true;
}

/** Reward credits (e.g. after watching an ad). */
export async function addCredits(n) {
  const ref = await ensureUserDocExists();
  await updateDoc(ref, { credits: increment(n) });
}

/* ---------- GENERATION HISTORY ---------- */

export async function saveGeneration({ text, voice, voiceId, audioUrl }) {
  const colRef = collection(db, "users", uid(), "history");
  await addDoc(colRef, {
    text: text.slice(0, 500),
    voice,
    voiceId,
    audioUrl: audioUrl || null,
    createdAt: serverTimestamp()
  });
}

export async function getHistory(max = 20) {
  const q = query(
    collection(db, "users", uid(), "history"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteHistoryItem(id) {
  await deleteDoc(doc(db, "users", uid(), "history", id));
}

/* ---------- FAVORITES ---------- */

export async function toggleFavorite(voiceId, voiceName) {
  const ref = doc(db, "users", uid(), "favorites", voiceId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  } else {
    await setDoc(ref, { voiceId, voiceName, addedAt: serverTimestamp() });
    return true;
  }
}

export async function getFavorites() {
  const snap = await getDocs(collection(db, "users", uid(), "favorites"));
  return snap.docs.map(d => d.data());
}
