
'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile, updateUserRole } from './firestore';

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth profile
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    await createUserProfile(user.uid, { displayName, email, avatarUrl: user.photoURL });

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
    
    // Force role update for specific user on login
    if (userCredential.user.email === 'tnbit2@gmail.com') {
      await updateUserRole(userCredential.user.uid, 'moderator');
    }

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
    // On first login, create a user profile document
    await createUserProfile(user.uid, { displayName: user.displayName, email: user.email, avatarUrl: user.photoURL });

    // Force role update for specific user on login
    if (user.email === 'tnbit2@gmail.com') {
      await updateUserRole(user.uid, 'moderator');
    }
    
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

// Auth state observer
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { auth } = initializeFirebase();
  return onAuthStateChanged(auth, callback);
}
