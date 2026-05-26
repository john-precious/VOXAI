/* ============================================================
   FIREBASE CONFIGURATION
   ------------------------------------------------------------
   
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔻🔻🔻
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjCTLHzVtMwFX6R5HQJ8rzVW435Y9HZqU",
  authDomain: "voxai-d3526.firebaseapp.com",
  databaseURL: "https://voxai-d3526-default-rtdb.firebaseio.com",
  projectId: "voxai-d3526",
  storageBucket: "voxai-d3526.firebasestorage.app",
  messagingSenderId: "263447274434",
  appId: "1:263447274434:web:abbd7db90abc2403536c5b",
  measurementId: "G-TJQFV1B5KW"
};
// 🔺🔺🔺 REPLACE THIS WITH YOUR REAL CONFIG FROM FIREBASE CONSOLE 🔺🔺🔺

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
