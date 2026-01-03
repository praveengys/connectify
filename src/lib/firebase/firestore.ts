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
  
  const userRole = data.email === 'tnbit2@gmail.com' ? 'moderator' : 'member';

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
    role: userRole,
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
export async function createForum(name: string, description: string, createdBy: string): Promise<Forum> {
    const firestore = getFirestoreInstance();
    const forumsCollection = collection(firestore, 'forums');
    const newForumData = {
        name,
        description,
        createdBy,
        visibility: 'public' as const,
        status: 'active' as const,
        createdAt: serverTimestamp(),
    };
    const newForumRef = await addDoc(forumsCollection, newForumData);

    return {
        id: newForumRef.id,
        ...newForumData,
        createdAt: new Date(),
    };
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

type ThreadData = Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt' | 'moderation'>;
export async function createThread(data: ThreadData): Promise<Thread> {
  const firestore = getFirestoreInstance();
  const threadsRef = collection(firestore, 'threads');
  
  if (!data.authorId) {
    throw new Error("Author ID is required to create a thread.");
  }

  const newThreadData = {
    ...data,
    replyCount: 0,
    latestReplyAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const newThreadRef = await addDoc(threadsRef, newThreadData);

  return {
    id: newThreadRef.id,
    ...newThreadData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
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


type ReplyData = {
    threadId: string;
    authorId: string;
    body: string;
    parentReplyId: string | null;
};
export async function createReply(data: ReplyData): Promise<void> {
    const firestore = getFirestoreInstance();
    const threadRef = doc(firestore, 'threads', data.threadId);
    const repliesRef = collection(threadRef, 'replies');
    
    if (!data.authorId) {
        throw new Error("Author ID is required to create a reply.");
    }
    
    await addDoc(repliesRef, {
        authorId: data.authorId,
        body: data.body,
        parentReplyId: data.parentReplyId,
        status: 'published',
        createdAt: serverTimestamp(),
    });

    await updateDoc(threadRef, {
        replyCount: increment(1),
        latestReplyAt: serverTimestamp(),
    });
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
  const senderId = messageData.senderId;
  if (!senderId) {
    throw new Error("Sender ID is required to create a chat message.");
  }
  
  const user = await getUserProfile(senderId);
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
export async function createChatGroup(name: string, type: 'public' | 'private', ownerId: string): Promise<Group> {
  const firestore = getFirestoreInstance();
  const groupsCollection = collection(firestore, 'groups');
  
  const newGroupData = {
    name,
    type,
    createdBy: ownerId,
    createdAt: serverTimestamp(),
    memberCount: 1,
    members: {
      [ownerId]: 'owner' as const
    },
  };

  const newGroupRef = await addDoc(groupsCollection, newGroupData);

  return {
    id: newGroupRef.id,
    ...newGroupData,
    createdAt: new Date(),
  };
}

export async function joinChatGroup(groupId: string, userId: string): Promise<void> {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);

    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist.");
        }

        const groupData = groupDoc.data();
        if (groupData.members[userId]) {
            // User is already a member, do nothing.
            return;
        }

        transaction.update(groupRef, {
            [`members.${userId}`]: 'member',
            memberCount: increment(1)
        });
    });
}

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
        
        transaction.update(groupRef, {
            members: newMembers,
            memberCount: increment(-1)
        });
    });
}

export async function updateUserGroupRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: role
    });
}

export async function sendChatMessage(groupId: string, senderId: string, messageContent: { type: 'text', text: string } | { type: 'image', imageUrl: string }): Promise<void> {
  const firestore = getFirestoreInstance();
  const user = await getUserProfile(senderId);
  if (!user) throw new Error("User not found");

  const messagesRef = collection(firestore, 'groups', groupId, 'messages');
  await addDoc(messagesRef, {
      senderId,
      senderProfile: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      ...messageContent,
      createdAt: serverTimestamp(),
      status: 'visible'
  });
  
  // Update last message on group for previews
  const groupRef = doc(firestore, 'groups', groupId);
  const lastMessageText = messageContent.type === 'text' ? messageContent.text : 'Sent an image';
  await updateDoc(groupRef, {
      'lastMessage.text': lastMessageText,
      'lastMessage.sender': user.displayName,
      'lastMessage.timestamp': serverTimestamp()
  });
}


// Social Feed functions
export async function createPost(authorId: string, content: string, visibility: 'public' | 'group-only' = 'public', media: string[] = []): Promise<void> {
  const firestore = getFirestoreInstance();
  const postsRef = collection(firestore, 'posts');

  await addDoc(postsRef, {
    authorId,
    content,
    media,
    visibility,
    status: 'active',
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    repostsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function toggleLikePost(postId: string, userId: string): Promise<void> {
  const firestore = getFirestoreInstance();
  const postRef = doc(firestore, 'posts', postId);
  const likeRef = doc(firestore, 'posts', postId, 'likes', userId);
  const likeSnap = await getDoc(likeRef);

  const batch = writeBatch(firestore);
  if (likeSnap.exists()) {
    // Unlike
    batch.delete(likeRef);
    batch.update(postRef, { likesCount: increment(-1) });
  } else {
    // Like
    batch.set(likeRef, { userId, createdAt: serverTimestamp() });
    batch.update(postRef, { likesCount: increment(1) });
  }
  await batch.commit();
}

export async function createComment(postId: string, authorId: string, content: string): Promise<void> {
  const firestore = getFirestoreInstance();
  const postRef = doc(firestore, 'posts', postId);
  const commentsRef = collection(postRef, 'comments');
  
  const batch = writeBatch(firestore);
  
  // Add new comment
  const newCommentRef = doc(commentsRef);
  batch.set(newCommentRef, {
    postId,
    authorId,
    content,
    parentCommentId: null,
    createdAt: serverTimestamp()
  });
  
  // Increment comments count on the post
  batch.update(postRef, { commentsCount: increment(1) });
  
  await batch.commit();
}

export async function sharePost(postId: string, userId: string): Promise<void> {
    const firestore = getFirestoreInstance();
    const postRef = doc(firestore, 'posts', postId);
    
    await updateDoc(postRef, { sharesCount: increment(1) });
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

type BookingRequest = {
  slotId: string;
  name: string;
  email: string;
  notes: string;
  uid?: string; // UID of the logged-in user
};

export async function bookDemo(request: BookingRequest): Promise<void> {
    const firestore = getFirestoreInstance();
    const { slotId, ...bookingData } = request;

    if (!bookingData.uid) {
        throw new Error("User must be logged in to book a demo.");
    }
    
    await runTransaction(firestore, async (transaction) => {
        const slotRef = doc(firestore, 'demoSlots', slotId);
        const slotDoc = await transaction.get(slotRef);

        if (!slotDoc.exists() || slotDoc.data().status !== 'available') {
          throw new Error("This time slot is no longer available. Please select another one.");
        }

        // Create the booking request document
        const bookingRef = doc(collection(firestore, 'demoBookings'));
        transaction.set(bookingRef, {
            ...bookingData,
            slotId: slotId,
            date: slotDoc.data().date,
            startTime: slotDoc.data().startTime,
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        // Mark the slot as pending
        transaction.update(slotRef, {
            status: 'pending',
            lockedByRequestId: bookingRef.id,
        });
    });
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

// Notification functions
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { auth, firestore } = initializeFirebase();
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const notifRef = doc(firestore, 'users', userId, 'notifications', notificationId);
  await updateDoc(notifRef, { isRead: true });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { auth, firestore } = initializeFirebase();
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const notifsRef = collection(firestore, 'users', userId, 'notifications');
  const q = query(notifsRef, where('isRead', '==', false));
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(firestore);
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
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
