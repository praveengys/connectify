
'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile } from './client-actions';

const { auth } = initializeFirebase();
const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(email: string, password: string, firstName: string, lastName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Update Firebase Auth profile
    await updateProfile(user, { displayName: fullName });
    
    // Create or link Firestore profile
    await createUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: fullName,
      memberFirstName: firstName,
      memberLastName: lastName
    });

    return { user };
  } catch (error: any) {
    return { error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    return { error };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    await createUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.photoURL
    });

    return { user };
  } catch (error: any) {
    return { error };
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthObserver(callback: (user: import('firebase/auth').User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return {};
  } catch (error: any) {
    return { error };
  }
}

