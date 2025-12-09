import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1eOQ1oiS8j41mkLImSD-t9ewjwCi9TTA",
  authDomain: "industrylandingpage-7f77a.firebaseapp.com",
  projectId: "industrylandingpage-7f77a",
  storageBucket: "industrylandingpage-7f77a.firebasestorage.app",
  messagingSenderId: "328623839246",
  appId: "1:328623839246:web:ad1f2ca35ce7a8bece445f",
  measurementId: "G-H7T94SMP3N"
};

const app = firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = getFirestore();
export const googleProvider = new firebase.auth.GoogleAuthProvider();