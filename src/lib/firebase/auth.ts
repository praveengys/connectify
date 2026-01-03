'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile } from './client-actions';


export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth profile
    await updateProfile(user, { displayName });

    // Create or link Firestore user profile
    await createUserProfile(user.uid, {
        displayName: displayName,
        email: user.email,
        avatarUrl: user.photoURL
    });

    return { user };
  } catch (error) {
    return { error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error };
  }
}

export async function signInWithGoogle() {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Create or link Firestore user profile
    await createUserProfile(user.uid, {
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.photoURL
    });

    return { user };
  } catch (error) {
    return { error };
  }
}

export async function signOutUser() {
  const { auth } = initializeFirebase();
  try {
    await signOut(auth);
    return {};
  } catch (error) {
    return { error };
  }
}

export async function sendPasswordReset(email: string) {
    const { auth } = initializeFirebase();
    try {
        await sendPasswordResetEmail(auth, email);
        return {};
    } catch (error) {
        return { error };
    }
}
