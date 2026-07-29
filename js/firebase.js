import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPhQiSUsMueMYkQ0i680epEKQ7pYDsT_I",
  authDomain: "sitraqfmlx.firebaseapp.com",
  projectId: "sitraqfmlx",
  storageBucket: "sitraqfmlx.firebasestorage.app",
  messagingSenderId: "716935536178",
  appId: "1:716935536178:web:079ce066b79988d261262b",
  measurementId: "G-MP4FT9HRRD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const COLLECTION_NAME = "dataSitraq";
