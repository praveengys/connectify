
'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createUserProfile, updateUserProfile } from './firestore';

const { auth } = initializeFirebase();
const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName });

    const userProfileData: { displayName: string; email: string; role?: 'admin' | 'moderator' } = {
      displayName: displayName,
      email: email,
    };

    if (email === 'tnbit@gmail.com') {
      userProfileData.role = 'admin';
    } else if (email === 'tnbit2@gmail.com') {
      userProfileData.role = 'moderator';
    }
    
    await createUserProfile(user.uid, userProfileData);

    return { user };
  } catch (error) {
    return { error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return { user };
  } catch (error: any) {
    // Handle specific error codes if necessary
    if (error.code === 'auth/popup-closed-by-user') {
      return { error: new Error('The sign-in process was cancelled.') };
    }
    return { error };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return {};
  } catch (error) {
    return { error };
  }
}

export async function sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (error) {
      return { error };
    }
}

export function onAuthStateChanged(callback: (user: any) => void) {
  return onFirebaseAuthStateChanged(auth, callback);
}
