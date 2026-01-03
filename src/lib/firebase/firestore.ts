
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
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, Thread, Reply, Group, Forum, Category, ChatMessage, DemoSlot, DemoBooking, Notification } from '@/lib/types';
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
  if (!uid) return null;
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

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserRole(uid: string, role: 'member' | 'admin' | 'moderator'): Promise<void> {
  const firestore = getFirestoreInstance();
  await updateDoc(doc(firestore, 'users', uid), { role });
}

export async function toggleMuteUser(uid: string, isMuted: boolean): Promise<void> {
  const firestore = getFirestoreInstance();
  await updateDoc(doc(firestore, 'users', uid), { isMuted });
}

export async function toggleBanUser(uid: string, isBanned: boolean): Promise<void> {
  const firestore = getFirestoreInstance();
  await updateDoc(doc(firestore, 'users', uid), { isBanned });
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

export async function toggleThreadLock(threadId: string, isLocked: boolean): Promise<void> {
    const firestore = getFirestoreInstance();
    await updateDoc(doc(firestore, 'threads', threadId), { isLocked });
}

export async function toggleThreadPin(threadId: string, isPinned: boolean): Promise<void> {
    const firestore = getFirestoreInstance();
    await updateDoc(doc(firestore, 'threads', threadId), { isPinned });
}


// Chat (Real-time) functions
export async function createChatMessage(threadId: string, messageData: Partial<ChatMessage>): Promise<void> {
  const firestore = getFirestoreInstance();
  const user = await getUserProfile(messageData.senderId!);
  if (!user) throw new Error("User not found");

  const messagesRef = collection(firestore, 'threads', threadId, 'chatMessages');
  await addDoc(messagesRef, {
      ...messageData,
      senderProfile: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      createdAt: serverTimestamp(),
      status: 'visible'
  });
}


// Group Chat functions
export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);
    
    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist.");
        }
        
        const groupData = groupDoc.data();
        if (!groupData.members[userId]) {
            return; // User is not a member
        }
        
        const newMembers = { ...groupData.members };
        delete newMembers[userId];

        const newMemberRoles = { ...groupData.memberRoles };
        delete newMemberRoles[userId];
        
        transaction.update(groupRef, {
            members: newMembers,
            memberRoles: newMemberRoles,
            memberCount: increment(-1)
        });
    });
}

export async function updateUserGroupRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
        [`memberRoles.${userId}`]: role
    });
}


// Demo Booking
export async function createDemoSlot(slotData: { date: string, startTime: string }): Promise<void> {
    const firestore = getFirestoreInstance();
    const slotsRef = collection(firestore, 'demoSlots');
    await addDoc(slotsRef, {
        ...slotData,
        status: 'available',
        lockedByRequestId: null,
        updatedAt: serverTimestamp(),
    });
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

export async function updateBookingStatus(bookingId: string, newStatus: 'scheduled' | 'denied'): Promise<void> {
    const firestore = getFirestoreInstance();
    const bookingRef = doc(firestore, 'demoBookings', bookingId);
    
    await runTransaction(firestore, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) {
            throw new Error("Booking request not found.");
        }
        
        const bookingData = bookingDoc.data() as DemoBooking;
        if (!bookingData.slotId) {
            transaction.update(bookingRef, { status: newStatus, reviewedAt: serverTimestamp() });
            return;
        }

        const slotRef = doc(firestore, 'demoSlots', bookingData.slotId);
        
        transaction.update(bookingRef, { 
            status: newStatus,
            reviewedAt: serverTimestamp(),
        });

        if (newStatus === 'scheduled') {
            transaction.update(slotRef, { status: 'booked' });
        } else { // 'denied'
            transaction.update(slotRef, { 
                status: 'available',
                lockedByRequestId: null,
            });
        }
    });
}

export async function deleteThread(threadId: string): Promise<void> {
    const firestore = getFirestoreInstance();
    const batch = writeBatch(firestore);

    // Delete replies and chat messages (subcollections)
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const chatRef = collection(firestore, 'threads', threadId, 'chatMessages');
    const repliesSnap = await getDocs(repliesRef);
    const chatSnap = await getDocs(chatRef);
    repliesSnap.forEach(doc => batch.delete(doc.ref));
    chatSnap.forEach(doc => batch.delete(doc.ref));

    // Delete the main thread doc
    const threadRef = doc(firestore, 'threads', threadId);
    batch.delete(threadRef);

    await batch.commit();
}


export async function deleteGroup(groupId: string): Promise<void> {
    const firestore = getFirestoreInstance();
    const batch = writeBatch(firestore);

    const messagesRef = collection(firestore, 'groups', groupId, 'messages');
    const typingRef = collection(firestore, 'groups', groupId, 'typing');
    const messagesSnap = await getDocs(messagesRef);
    const typingSnap = await getDocs(typingRef);
    messagesSnap.forEach(doc => batch.delete(doc.ref));
    typingSnap.forEach(doc => batch.delete(doc.ref));

    const groupRef = doc(firestore, 'groups', groupId);
    batch.delete(groupRef);

    await batch.commit();
}
