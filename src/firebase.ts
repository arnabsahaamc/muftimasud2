import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0xR0RZOaTbqKtm0TCoT6ZBOUsCk9MfXQ",
  authDomain: "mufti-masud.firebaseapp.com",
  projectId: "mufti-masud",
  storageBucket: "mufti-masud.firebasestorage.app",
  messagingSenderId: "731668094280",
  appId: "1:731668094280:web:7aa7c5d03d20963b2b677d",
  measurementId: "G-F8WXT8RC9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
