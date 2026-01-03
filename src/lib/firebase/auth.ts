
'use client';

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
  updateDoc,
} from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

const { auth, firestore } = initializeFirebase();

async function getOrCreateUserProfile(
  user: FirebaseUser
): Promise<UserProfile> {
  const userRef = doc(firestore, 'users', user.uid);
  let userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // If profile with Auth UID doesn't exist, check for pre-existing data via email
    if (user.email) {
      const usersCollection = collection(firestore, 'users');
      const q = query(
        usersCollection,
        where('memberEmailAddress', '==', user.email),
        limit(1)
      );
      const existingUserQuerySnap = await getDocs(q);

      if (!existingUserQuerySnap.empty) {
        // Found a pre-existing user document by email. We need to update it.
        const existingUserDoc = existingUserQuerySnap.docs[0];
        const existingUserData = existingUserDoc.data() as UserProfile;
        
        // This is a critical step: we are creating a NEW user profile document
        // with the Firebase Auth UID, but we are copying over the data from the
        // OLD numeric-ID based document.
        const newProfileData: Partial<UserProfile> = {
            ...existingUserData, // Copy all existing data
            uid: user.uid, // Set the correct Auth UID
            displayName: user.displayName || existingUserData.memberFirstName || 'New Member',
            email: user.email,
            avatarUrl: user.photoURL || existingUserData.avatarUrl || null,
            role: 'member', // Default role
            updatedAt: new Date(),
            lastActiveAt: new Date(),
            // Important: We don't copy over createdAt to avoid overriding it if it was set before
        };

        if (user.email === 'tnbit@gmail.com' || user.email === 'tnbit2@gmail.com') {
          newProfileData.role = 'admin';
        } else if (user.email === 'pgy@gmail.com' || user.email === 'pg1@gmail.com') {
          newProfileData.role = 'moderator';
        }

        await setDoc(userRef, newProfileData, { merge: true });
        userSnap = await getDoc(userRef); // Re-fetch the newly created doc

      }
    }
  }

    // If still no userSnap, create a brand new profile
    if (!userSnap.exists()) {
        const username = user.email ? user.email.split('@')[0] : `user_${user.uid.substring(0, 6)}`;
        const newUserProfile: UserProfile = {
            uid: user.uid,
            username: username,
            displayName: user.displayName || 'New Member',
            email: user.email,
            avatarUrl: user.photoURL || null,
            bio: '',
            interests: [],
            skills: [],
            languages: [],
            location: '',
            currentlyExploring: '',
            company: '',
            role: 'member',
            profileVisibility: 'public',
            emailVerified: user.emailVerified,
            profileScore: 0,
            postCount: 0,
            commentCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActiveAt: new Date(),
        };

        if (user.email === 'tnbit@gmail.com' || user.email === 'tnbit2@gmail.com') {
          newUserProfile.role = 'admin';
        } else if (user.email === 'pgy@gmail.com' || user.email === 'pg1@gmail.com') {
          newUserProfile.role = 'moderator';
        }

        await setDoc(userRef, newUserProfile);
        userSnap = await getDoc(userRef);
    }
    
    const profileData = userSnap.data() as UserProfile;
    return {
        ...profileData,
        uid: userSnap.id,
        createdAt: profileData.createdAt instanceof Timestamp ? profileData.createdAt.toDate() : new Date(),
        updatedAt: profileData.updatedAt instanceof Timestamp ? profileData.updatedAt.toDate() : new Date(),
        lastActiveAt: profileData.lastActiveAt instanceof Timestamp ? profileData.lastActiveAt.toDate() : new Date(),
    };
}


export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName });
    await getOrCreateUserProfile(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    await getOrCreateUserProfile(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    await getOrCreateUserProfile(result.user);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export function onAuthUserChanged(
  callback: (user: UserProfile | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userProfile = await getOrCreateUserProfile(user);
      callback(userProfile);
    } else {
      callback(null);
    }
  });
}
