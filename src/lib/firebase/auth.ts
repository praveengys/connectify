
'use client';

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile } from './firestore';
import { updateUserRole } from './client-actions';

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const { auth } = initializeFirebase();
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await createUserProfile(user.uid, { email, displayName, avatarUrl: user.photoURL });
    return { user };
  } catch (error: any) {
    return { error };
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const { auth } = initializeFirebase();
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return { user };
  } catch (error: any) {
    return { error };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const { auth } = initializeFirebase();
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    await createUserProfile(user.uid, { email: user.email, displayName: user.displayName, avatarUrl: user.photoURL });
    return { user };
  } catch (error: any) {
    return { error };
  }
}

// Sign out
export async function signOutUser() {
  const { auth } = initializeFirebase();
  await signOut(auth);
}

// Password reset
export async function sendPasswordReset(email: string) {
  try {
    const { auth } = initializeFirebase();
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

export { onAuthStateChanged, type User };
