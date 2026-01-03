// src/lib/firebase/auth.ts
'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/firebase/client';
import { createUserProfile } from './client-actions';


// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, firstName: string, lastName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth profile
    const displayName = `${firstName} ${lastName}`.trim();
    await updateProfile(user, { displayName });

    // Create user profile document in Firestore
    await createUserProfile(user.uid, { 
      displayName,
      memberFirstName: firstName,
      memberLastName: lastName,
      memberEmailAddress: email,
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
    
    // Check if a user profile already exists. If not, create one.
    // This handles both new sign-ups and returning users.
    await createUserProfile(user.uid, {
        displayName: user.displayName || 'New Member',
        memberEmailAddress: user.email!,
        avatarUrl: user.photoURL,
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
