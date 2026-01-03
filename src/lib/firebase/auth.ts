'use client';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type AuthError,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


async function handleAuthError(error: unknown) {
  const authError = error as AuthError;
  console.error('Firebase Auth Error:', authError.code, authError.message);
  return { error: { message: authError.message } };
}

export async function signUpWithEmail(email: string, password: string,firstName: string, lastName: string) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // Profile creation is now handled by a server-side function triggered on user creation
    return { error: null };
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { error: null };
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    return { error: null };
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return null;
  } catch (error) {
    const authError = error as AuthError;
    return { message: authError.message };
  }
}

export async function signOutUser() {
  await signOut(auth);
}
