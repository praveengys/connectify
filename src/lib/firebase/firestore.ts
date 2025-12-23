
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, DocumentData, collection, getDocs, query, where, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import type { UserProfile, Thread, Forum } from '@/lib/types';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

// Create a new user profile document in Firestore
export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    console.error("createUserProfile called without a valid uid");
    return;
  }
  try {
    // Add the user's UID to the data object to satisfy security rules.
    await setDoc(doc(firestore, 'users', uid), {
      ...data,
      uid: uid, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error creating user profile: ", error);
  }
}

// Get a user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const docRef = doc(firestore, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as DocumentData;
            // Convert Firestore Timestamps to JS Date objects
            return {
                ...data,
                uid: docSnap.id,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as UserProfile;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting user profile: ", error);
        return null;
    }
}

// Update a user profile document
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    if (!uid) {
        throw new Error('updateUserProfile called without a valid uid');
    }
    try {
        const userRef = doc(firestore, 'users', uid);
        await setDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error updating user profile: ", error);
        throw error;
    }
}

// Get all public user profiles
export async function getPublicProfiles(limitCount = 20): Promise<UserProfile[]> {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(
      usersRef,
      where('profileVisibility', '==', 'public'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching public profiles:', error);
    return [];
  }
}

// Create a new discussion thread
export async function createThread(threadData: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'replyCount'>) {
    try {
        const threadsCollection = collection(firestore, 'threads');
        const docRef = await addDoc(threadsCollection, {
            ...threadData,
            replyCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, ...threadData };
    } catch (error) {
        console.error("Error creating thread: ", error);
        throw error;
    }
}

// Create a new forum for review
export async function createForum(forumData: Omit<Forum, 'id' | 'createdAt' | 'status'>) {
    try {
        const forumsCollection = collection(firestore, 'forums');
        const docRef = await addDoc(forumsCollection, {
            ...forumData,
            status: 'active',
            visibility: 'public', // Default to public, can be changed by mods
            createdAt: serverTimestamp(),
        });
        const newForumData = { id: docRef.id, status: 'active', ...forumData };
        return newForumData as Forum;
    } catch (error) {
        console.error("Error creating forum: ", error);
        throw error;
    }
}
