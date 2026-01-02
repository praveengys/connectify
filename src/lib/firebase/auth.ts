
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
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, getDoc, getCountFromServer, collection } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { FirebaseError } from 'firebase/app';

// Helper to check if this is the first user
async function isFirstUser() {
  const { firestore } = initializeFirebase();
  const usersCollection = collection(firestore, 'users');
  const snapshot = await getCountFromServer(usersCollection);
  return snapshot.data().count === 0;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const { auth, firestore } = initializeFirebase();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(user, { displayName: name });

    const firstUser = await isFirstUser();

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      displayName: name,
      username: name.toLowerCase().replace(/\s+/g, ''), // simple username
      email: user.email,
      avatarUrl: user.photoURL,
      bio: '',
      role: firstUser ? 'admin' : 'member',
      profileVisibility: 'public',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      emailVerified: user.emailVerified,
      interests: [],
      skills: [],
      languages: [],
      location: '',
      currentlyExploring: '',
      profileScore: 0,
      postCount: 0,
      commentCount: 0,
    };
    await setDoc(doc(firestore, 'users', user.uid), userProfile);

    return { user: userCredential, error: null };
  } catch (e) {
    return { user: null, error: e as FirebaseError };
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { auth } = initializeFirebase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // On sign-in, update last active time
    const user = userCredential.user;
    const { firestore } = initializeFirebase();
    await setDoc(doc(firestore, 'users', user.uid), { lastActiveAt: new Date() }, { merge: true });
    return { userCredential, error: null };
  } catch (e) {
    return { userCredential: null, error: e as FirebaseError };
  }
}

export async function signInWithGoogle() {
  const { auth, firestore } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // New user via Google
      const firstUser = await isFirstUser();
      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Google User',
        username: user.email?.split('@')[0] || user.uid,
        email: user.email,
        avatarUrl: user.photoURL,
        bio: '',
        role: firstUser ? 'admin' : 'member',
        profileVisibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
        emailVerified: user.emailVerified,
        interests: [],
        skills: [],
        languages: [],
        location: '',
        currentlyExploring: '',
        profileScore: 0,
        postCount: 0,
        commentCount: 0,
      };
      await setDoc(userDocRef, userProfile);
    } else {
        // Existing user
         await setDoc(userDocRef, { lastActiveAt: new Date(), avatarUrl: user.photoURL }, { merge: true });
    }

    return { result, error: null };
  } catch (e) {
    return { result: null, error: e as FirebaseError };
  }
}

export async function signOutUser() {
  const { auth } = initializeFirebase();
  try {
    await signOut(auth);
    return { error: null };
  } catch (e) {
    return { error: e as FirebaseError };
  }
}

export async function sendPasswordReset(email: string) {
    const { auth } = initializeFirebase();
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (e) {
        return { error: e as FirebaseError };
    }
}
