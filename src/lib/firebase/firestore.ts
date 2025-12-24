

'use server';

import { doc, setDoc, getDoc, serverTimestamp, updateDoc, DocumentData, collection, getDocs, query, where, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import type { UserProfile, Thread, Forum, Category, Reply } from '@/lib/types';
import { initializeFirebase } from '@/firebase';

// This function gets the firestore instance. It's defined once to avoid repetition.
function getFirestoreInstance() {
    return initializeFirebase().firestore;
}

// Create a new user profile document in Firestore
export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    console.error("createUserProfile called without a valid uid");
    return;
  }
  try {
    const firestore = getFirestoreInstance();
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
        const firestore = getFirestoreInstance();
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
        const firestore = getFirestoreInstance();
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
    const firestore = getFirestoreInstance();
    const usersRef = collection(firestore, 'users');
    const q = query(
      usersRef,
      where('profileVisibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
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
export async function createThread(threadData: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'replyCount' | 'categoryId'> & { categoryId: string }) {
    try {
        const firestore = getFirestoreInstance();
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

// Create a new forum
export async function createForum(forumData: Omit<Forum, 'id' | 'createdAt' | 'status' | 'visibility'>) {
    try {
        const firestore = getFirestoreInstance();
        const forumsCollection = collection(firestore, 'forums');
        const docRef = await addDoc(forumsCollection, {
            ...forumData,
            status: 'active',
            visibility: 'public',
            createdAt: serverTimestamp(),
        });
        const newForumData = { id: docRef.id, status: 'active', visibility: 'public', ...forumData };
        return newForumData as Forum;
    } catch (error) {
        console.error("Error creating forum: ", error);
        throw error;
    }
}

// Get or create a category
export async function getOrCreateCategory(name: string): Promise<Category | null> {
  const normalizedName = name.trim();
  const slug = normalizedName.toLowerCase().replace(/\s+/g, '-');
  
  if (!normalizedName) return null;

  const firestore = getFirestoreInstance();
  const categoriesRef = collection(firestore, 'categories');
  const q = query(categoriesRef, where('slug', '==', slug));

  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Category exists, return it
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Category;
    } else {
      // Category does not exist, create it
      const newCategoryData = {
        name: normalizedName,
        slug: slug,
        description: `Discussions about ${normalizedName}`, // Default description
        threadCount: 0,
      };
      const docRef = await addDoc(categoriesRef, newCategoryData);
      return { id: docRef.id, ...newCategoryData } as Category;
    }
  } catch (error) {
    console.error("Error in getOrCreateCategory: ", error);
    throw error;
  }
}

// Get a single thread from Firestore
export async function getThread(threadId: string): Promise<Thread | null> {
    try {
        const firestore = getFirestoreInstance();
        const docRef = doc(firestore, 'threads', threadId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as Thread;
        }
        return null;
    } catch (error) {
        console.error('Error fetching thread:', error);
        return null;
    }
}

// Get all replies for a given thread
export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    try {
        const firestore = getFirestoreInstance();
        const repliesRef = collection(firestore, 'threads', threadId, 'replies');
        const q = query(repliesRef, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
            } as Reply;
        });
    } catch (error) {
        console.error('Error fetching replies:', error);
        return [];
    }
}

// Create a new reply
export async function createReply(replyData: Omit<Reply, 'id' | 'createdAt' | 'status'>) {
    try {
        const firestore = getFirestoreInstance();
        const { threadId } = replyData;
        const repliesCollection = collection(firestore, 'threads', threadId, 'replies');
        
        // Use a temporary ID for the optimistic update
        const tempId = doc(collection(firestore, '_')).id;

        const newReplyData = {
            ...replyData,
            status: 'published',
            createdAt: serverTimestamp(),
        };

        const docRef = doc(repliesCollection, tempId);
        // Don't await setDoc for optimistic updates
        setDoc(docRef, newReplyData);

        // Increment replyCount on the parent thread in the background
        const threadRef = doc(firestore, 'threads', threadId);
        getDoc(threadRef).then(threadSnap => {
            if (threadSnap.exists()) {
                const currentCount = threadSnap.data().replyCount || 0;
                updateDoc(threadRef, { 
                    replyCount: currentCount + 1,
                    latestReplyAt: serverTimestamp()
                });
            }
        });

        // Return the data with the temporary ID for the UI
        return {
            id: tempId,
            ...replyData,
            status: 'published',
            createdAt: new Date(), // Use local time for optimistic UI
            pending: true,
        };
    } catch (error) {
        console.error("Error creating reply: ", error);
        throw error;
    }
}
