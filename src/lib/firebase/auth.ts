'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile } from './client-actions';

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth profile
    await updateFirebaseProfile(user, { displayName });

    // Create user profile in Firestore
    await createUserProfile(user.uid, { displayName, email });

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: { code: error.code, message: error.message } };
  }
}


// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: { code: error.code, message: error.message } };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
    const { auth } = initializeFirebase();
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        // You might want to check if the user document exists in Firestore
        // and create it if it doesn't.
        await createUserProfile(user.uid, { displayName: user.displayName, email: user.email, avatarUrl: user.photoURL });
        return { user, error: null };
    } catch (error: any) {
        return { user: null, error: { code: error.code, message: error.message } };
    }
}

// Sign out
export async function signOutUser() {
  const { auth } = initializeFirebase();
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: { code: error.code, message: error.message } };
  }
}

// Password reset
export async function sendPasswordReset(email: string) {
    const { auth } = initializeFirebase();
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error: any) {
        return { error: { code: error.code, message: error.message } };
    }
}
