
'use server';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
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
    await createUserProfile(user.uid, { displayName, email });

    return { user };
  } catch (error: any) {
    return { error };
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    return { error };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
    const { auth } = initializeFirebase();
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user profile already exists, if not create one
        await createUserProfile(user.uid, {
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.photoURL,
        });

        return { user: result.user };
    } catch (error: any) {
        return { error };
    }
}


// Sign out
export async function signOutUser() {
  const { auth } = initializeFirebase();
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { error };
  }
}

// Send password reset email
export async function sendPasswordReset(email: string) {
  const { auth } = initializeFirebase();
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { error };
  }
}
