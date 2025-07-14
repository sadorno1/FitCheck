import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDCHaN-GVTV57y4QvSkaHmJGlscPEWePu4",
  authDomain: "fitcheck-430d2.firebaseapp.com",
  projectId: "fitcheck-430d2",
  storageBucket: "fitcheck-430d2.firebasestorage.app",
  messagingSenderId: "52078683306",
  appId: "1:52078683306:web:7f6a722a77033163b29cd3",
  measurementId: "G-P52V13CT6N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
