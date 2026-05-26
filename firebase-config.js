/* ============================================================
   FIREBASE CONFIGURATION
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com
   2. Create a new project (e.g. "voxai")
   3. Click the </> "Add web app" icon
   4. Copy the firebaseConfig object below and replace this one
   5. In the left sidebar:
        Build → Authentication → Get Started
        → Enable "Email/Password" provider
        → Enable "Google" provider (optional)
      Build → Firestore Database → Create database
        → Start in "production mode"
        → Pick a region close to your users
   6. Go to Firestore → Rules tab → paste the rules below → Publish:

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
            match /history/{docId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            match /favorites/{docId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
      }

   7. Authentication → Settings → Authorized domains:
        add your production domain (e.g. voxai.com)
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔻🔻🔻 REPLACE THIS WITH YOUR REAL CONFIG FROM FIREBASE CONSOLE 🔻🔻🔻
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
