import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";


const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "medisync-300e5.firebaseapp.com",
  projectId: "medisync-300e5",
  storageBucket: "medisync-300e5.firebasestorage.app",
  messagingSenderId: "241681212441",
  appId: "1:241681212441:web:050c066f0cbb26ad62f688",
  measurementId: "G-B3QM3DCKRV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const doctorsCollection = collection(db, "doctors")
export const patientsCollection = collection(db, "patients")
export const notesCollection = collection(db, "notes")