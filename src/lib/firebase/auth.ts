'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile } from './firestore';

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });
    
    // Create user profile in Firestore
    await createUserProfile(user.uid, {
        name,
        email,
        authProvider: 'password',
        profileVisibility: 'public',
    });

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // On first sign-in, this will create the profile.
    await createUserProfile(user.uid, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        authProvider: 'google.com',
        profileVisibility: 'public',
    });

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

// Password Reset
export async function sendPasswordReset(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error: any) {
        return { error };
    }
}

// Auth state observer
export function onAuthStateChanged(callback: (user: User | null) => void) {
  return onFirebaseAuthStateChanged(auth, callback);
}
