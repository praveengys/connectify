
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
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, Thread, Reply, Group, Forum, Category, ChatMessage, DemoSlot, DemoBooking } from '@/lib/types';
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

export async function updateUserRole(uid: string, role: 'member' | 'admin'): Promise<void> {
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
    const newForumRef = await addDoc(forumsCollection, {
        name,
        description,
        createdBy,
        visibility: 'public',
        status: 'active',
        createdAt: serverTimestamp(),
    });

    return {
        id: newForumRef.id,
        name,
        description,
        createdBy,
        visibility: 'public',
        status: 'active',
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
  
  const newThreadRef = await addDoc(threadsRef, {
    ...data,
    replyCount: 0,
    latestReplyAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: newThreadRef.id,
    ...data,
    replyCount: 0,
    latestReplyAt: null,
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
        
        // Firestore does not allow deleting fields inside a transaction easily
        // without reading first, which we did. We create a new members object.
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
  const newCommentRef = doc(commentsRef); // Create a new doc reference
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

export async function createDemoSlot(slotData: { date: string, startTime: string, status: 'available' }): Promise<void> {
    const firestore = getFirestoreInstance();
    const slotsRef = collection(firestore, 'demoSlots');
    await addDoc(slotsRef, {
        ...slotData,
        isBooked: false, // For backward compatibility with old UI if any
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
};

export async function bookDemo(request: BookingRequest): Promise<void> {
    const firestore = getFirestoreInstance();
    const slotRef = doc(firestore, 'demoSlots', request.slotId);
    
    await runTransaction(firestore, async (transaction) => {
        const slotDoc = await transaction.get(slotRef);
        if (!slotDoc.exists() || slotDoc.data().status !== 'available') {
            throw new Error("This slot is no longer available. Please select another time.");
        }

        // Create a new booking request
        const bookingRef = doc(collection(firestore, 'demoBookings'));
        transaction.set(bookingRef, {
            ...request,
            date: slotDoc.data().date,
            startTime: slotDoc.data().startTime,
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        // Lock the slot by setting its status to 'pending'
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
        const slotRef = doc(firestore, 'demoSlots', bookingData.slotId);
        
        // Update the booking request status
        transaction.update(bookingRef, { 
            status: newStatus,
            reviewedAt: serverTimestamp(),
        });

        if (newStatus === 'scheduled') {
            // Mark the slot as booked
            transaction.update(slotRef, { status: 'booked' });
        } else { // 'denied'
            // Make the slot available again
            const slotDoc = await transaction.get(slotRef);
            // Only unlock if this booking was the one that locked it
            if (slotDoc.exists() && slotDoc.data().lockedByRequestId === bookingId) {
                transaction.update(slotRef, { 
                    status: 'available',
                    lockedByRequestId: null,
                });
            }
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
