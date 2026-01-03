
'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile } from './client-actions';

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const { auth } = initializeFirebase();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
      // Create user profile document in Firestore
      await createUserProfile(user.uid, { displayName, email, emailVerified: user.emailVerified });
    }
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const { auth } = initializeFirebase();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Upon successful sign-in, check if a profile exists, and create one if not.
    await createUserProfile(userCredential.user.uid, { 
      displayName: userCredential.user.displayName, 
      email: userCredential.user.email,
      avatarUrl: userCredential.user.photoURL,
      emailVerified: userCredential.user.emailVerified
    });
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const { auth } = initializeFirebase();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // Upon successful sign-in, check if a profile exists, and create one if not.
    await createUserProfile(user.uid, { 
      displayName: user.displayName, 
      email: user.email,
      avatarUrl: user.photoURL,
      emailVerified: user.emailVerified
    });
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign out
export async function signOutUser() {
  try {
    const { auth } = initializeFirebase();
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

// Send password reset email
export async function sendPasswordReset(email: string) {
  try {
    const { auth } = initializeFirebase();
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
