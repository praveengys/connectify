'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile, getUserProfile } from './firestore';

const ensureUserProfile = async (user: User) => {
    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
        await createUserProfile(user.uid, {
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.photoURL,
        });
    }
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await ensureUserProfile(user);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(userCredential.user);
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
    await ensureUserProfile(result.user);
    return { user: result.user, error: null };
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

// Send password reset email
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
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { auth } = initializeFirebase();
  return onAuthStateChanged(auth, callback);
}
