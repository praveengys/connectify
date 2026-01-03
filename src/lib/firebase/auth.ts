
'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile } from './firestore';

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth profile
    await updateProfile(user, { displayName });

    // Create a user profile in Firestore
    await createUserProfile(user.uid, {
      displayName: displayName,
      email: user.email,
      avatarUrl: user.photoURL,
    });

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // You might want to check if the user is new and create a profile for them here
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign out
export async function signOutUser() {
  const { auth } = initializeFirebase();
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

// Password Reset
export async function sendPasswordReset(email: string) {
    const { auth } = initializeFirebase();
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error: any) {
        return { error };
    }
}

// Listen for auth state changes
export function onAuthChanges(callback: (user: User | null) => void) {
  const { auth } = initializeFirebase();
  return onAuthStateChanged(auth, callback);
}
