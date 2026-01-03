
'use server';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, Thread, Reply, Category, DemoSlot } from '@/lib/types';
import { format } from 'date-fns';

// Helper to get Firestore instance
function getFirestoreInstance() {
  return initializeFirebase().firestore;
}

// User Profile Functions
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      uid: docSnap.id,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
      lastActiveAt: data.lastActiveAt?.toDate() ?? new Date(),
    } as UserProfile;
  } else {
    return null;
  }
}

// Forum & Thread Functions
export async function getOrCreateCategory(name: string): Promise<Category | null> {
    const firestore = getFirestoreInstance();
    const categoriesCollection = collection(firestore, 'categories');
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const q = query(categoriesCollection, where('slug', '==', slug));
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Category;
    } else {
        // In a server context, we can't create it, so we should indicate it's not found.
        // The creation should be handled by a client action if needed.
        return null;
    }
}

export async function getThread(threadId: string): Promise<Thread | null> {
    const firestore = getFirestoreInstance();
    const threadRef = doc(firestore, 'threads', threadId);
    const docSnap = await getDoc(threadRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
        } as Thread;
    }
    return null;
}

export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const firestore = getFirestoreInstance();
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, where('status', '==', 'published'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
    } as Reply));
}

// Demo Booking
export async function getAvailableTimeSlots(date: Date): Promise<DemoSlot[]> {
  const firestore = getFirestoreInstance();
  const dateStr = format(date, 'yyyy-MM-dd');
  const slotsRef = collection(firestore, 'demoSlots');
  
  const q = query(
    slotsRef,
    where('date', '==', dateStr),
    where('status', '==', 'available')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DemoSlot));
}
