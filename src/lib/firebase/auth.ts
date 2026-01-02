
'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, getDoc, getCountFromServer, collection } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { FirebaseError } from 'firebase/app';

const { auth } = initializeFirebase();
const googleProvider = new GoogleAuthProvider();

async function createUserProfile(user: User, displayName: string, email: string): Promise<UserProfile> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    // If the profile already exists, just return it.
    // This can happen with social sign-ins if the user already has an account.
    return userDoc.data() as UserProfile;
  }
  
  // Check if this is the first user or the designated admin email
  const usersRef = collection(firestore, 'users');
  const userCountSnapshot = await getCountFromServer(usersRef);
  const isFirstUser = userCountSnapshot.data().count === 0;
  const isDesignatedAdmin = email.toLowerCase() === 'tnbit@gmail.com';

  const newUserProfile: UserProfile = {
    uid: user.uid,
    displayName: displayName,
    email: email,
    username: displayName.toLowerCase().replace(/\s+/g, '_').slice(0, 15) + Math.random().toString(36).substring(2, 7),
    avatarUrl: user.photoURL,
    bio: '',
    interests: [],
    skills: [],
    languages: [],
    location: '',
    currentlyExploring: '',
    role: isFirstUser || isDesignatedAdmin ? 'admin' : 'member', // Assign admin role
    profileVisibility: 'public',
    emailVerified: user.emailVerified,
    profileScore: 0,
    postCount: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };

  await setDoc(userRef, newUserProfile);
  return newUserProfile;
}


export async function signUpWithEmail(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth profile
    await updateProfile(user, { displayName: name });
    
    // Create user profile in Firestore
    await createUserProfile(user, name, email);

    return { user: userCredential.user, error: null };
  } catch (error) {
    if (error instanceof FirebaseError) {
      return { user: null, error };
    }
    return { user: null, error: new FirebaseError('unknown', 'An unknown error occurred.') };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
     if (error instanceof FirebaseError) {
      return { user: null, error };
    }
    return { user: null, error: new FirebaseError('unknown', 'An unknown error occurred.') };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create user profile if it doesn't exist
    await createUserProfile(user, user.displayName || 'Google User', user.email || '');

    return { user, error: null };
  } catch (error) {
    if (error instanceof FirebaseError) {
      return { user: null, error };
    }
    return { user: null, error: new FirebaseError('unknown', 'An unknown error occurred.') };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof FirebaseError) {
      return { success: false, error };
    }
    return { success: false, error: new FirebaseError('unknown', 'An unknown error occurred.') };
  }
}

export async function sendPasswordReset(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error) {
        if (error instanceof FirebaseError) {
            return { error };
        }
        return { error: new FirebaseError('unknown', 'An unknown error occurred.') };
    }
}
