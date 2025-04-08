// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDmCi_b29dzGvaXuKkRNDMK3J2WnSWh4po",
    authDomain: "school-index-10067.firebaseapp.com",
    projectId: "school-index-10067",
    storageBucket: "school-index-10067.firebasestorage.app",
    messagingSenderId: "1004556224577",
    appId: "1:1004556224577:web:4b5473ab25aa93e6bd1ec0",
    measurementId: "G-FTKWPNS340"
  };

// Firebase を初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;