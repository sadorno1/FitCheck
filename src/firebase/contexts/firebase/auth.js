import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

// Register with email and password
export const doCreateUserWithEmailAndPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Login with email and password
export const doSignInWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign in with Google
export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result=await signInWithEmailAndPassword(auth, provider);
  return result
};

export const doSignOut = () => {
    return auth.signOut();
}
