
'use server';

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp,
  serverTimestamp,
  query,
  where,
  increment,
  writeBatch,
  orderBy,
  deleteDoc,
  limit,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, Category, DemoSlot, Report } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { format } from 'date-fns';

// Helper to get Firestore instance
function getFirestoreInstance() {
  try {
    return initializeFirebase().firestore;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', error);
    }
    throw error;
  }
}

// User Profile Functions
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  const username = data.email ? data.email.split('@')[0] : `user_${uid.substring(0, 6)}`;
  
  await setDoc(userRef, {
    uid: uid,
    username: username,
    displayName: data.displayName || 'New Member',
    email: data.email,
    avatarUrl: data.avatarUrl || null,
    bio: '',
    interests: [],
    skills: [],
    languages: [],
    location: '',
    currentlyExploring: '',
    company: '',
    role: 'member',
    profileVisibility: 'public',
    emailVerified: false,
    profileScore: 0,
    postCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  }, { merge: true });
}


export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  try {
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
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn(`Permission denied fetching profile for UID: ${uid}. This can happen if rules deny access or the user doesn't exist.`);
      return null;
    }
    console.error("Error fetching user profile:", error);
    throw error;
  }
}


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
        const newCategoryRef = await addDoc(categoriesCollection, {
            name,
            slug,
            description: `Discussions related to ${name}`,
            threadCount: 0,
        });
        return {
            id: newCategoryRef.id,
            name,
            slug,
            description: `Discussions related to ${name}`,
            threadCount: 0,
        };
    }
}


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

export async function updateReportStatus(reportId: string, status: Report['status']): Promise<void> {
    const firestore = getFirestoreInstance();
    const reportRef = doc(firestore, 'reports', reportId);
    await updateDoc(reportRef, { status });
}
