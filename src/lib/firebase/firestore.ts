
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
  runTransaction,
  orderBy,
  deleteDoc,
  limit,
  Firestore,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, Thread, Reply, Group, Forum, Category, DemoSlot, DemoBooking, Notification } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { format } from 'date-fns';

let db: Firestore | null = null;

async function getFirestoreInstance(): Promise<Firestore> {
    if (!db) {
        try {
            db = initializeFirebase().firestore;
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', error);
            }
            throw error;
        }
    }
    return db;
}


// User Profile Functions
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const firestore = await getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  const username = data.email ? data.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : `user_${uid.substring(0, 6)}`;
  
  const userData: UserProfile = {
    uid: uid,
    username: username,
    displayName: data.displayName || 'New Member',
    email: data.email || null,
    avatarUrl: data.avatarUrl || null,
    bio: '',
    interests: [],
    skills: [],
    languages: [],
    location: '',
    currentlyExploring: '',
    company: '',
    role: data.role || 'member',
    profileVisibility: 'public',
    emailVerified: data.emailVerified || false,
    profileScore: 0,
    postCount: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };

  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  const firestore = await getFirestoreInstance();
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

// Forum & Category Functions
export async function getOrCreateCategory(name: string): Promise<Category | null> {
    const firestore = await getFirestoreInstance();
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

// Demo Booking Functions
export async function getAvailableTimeSlots(date: Date): Promise<DemoSlot[]> {
  const firestore = await getFirestoreInstance();
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

// Notification Functions
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
  const firestore = await getFirestoreInstance();
  const notifRef = collection(firestore, 'users', notification.recipientId, 'notifications');
  await addDoc(notifRef, {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
  });
}