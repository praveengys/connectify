
'use server';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  Timestamp,
  serverTimestamp,
  query,
  where,
  increment,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebase, initializeFirebaseAdmin } from '@/firebase';
import type { UserProfile, Forum, Thread, Reply, Category, Group, ChatMessage, Post } from './types';
import { notFound } from 'next/navigation';
import { startOfDay, endOfDay } from 'date-fns';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      uid: userSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      lastActiveAt: data.lastActiveAt instanceof Timestamp ? data.lastActiveAt.toDate() : new Date(),
    } as UserProfile;
  } else {
    return null;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function createForum(name: string, description: string, creatorId: string): Promise<Forum> {
  const { firestore } = initializeFirebase();
  const forumsRef = collection(firestore, 'forums');
  const newForum: Omit<Forum, 'id'> = {
    name,
    description,
    createdBy: creatorId,
    visibility: 'public',
    status: 'active',
    createdAt: serverTimestamp() as Timestamp,
  };
  const docRef = await addDoc(forumsRef, newForum);
  return { id: docRef.id, ...newForum } as Forum;
}

export async function getOrCreateCategory(name: string): Promise<Category | null> {
  const { firestore } = initializeFirebase();
  const categoriesRef = collection(firestore, 'categories');
  const q = query(categoriesRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Category;
  } else {
    const newCategory = {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Discussions related to ${name}`,
      threadCount: 0,
    };
    const docRef = await addDoc(categoriesRef, newCategory);
    return { id: docRef.id, ...newCategory } as Category;
  }
}

export async function createThread(data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt' >): Promise<Thread> {
  const { firestore } = initializeFirebase();
  const threadsRef = collection(firestore, 'threads');
  const newThreadData = {
    ...data,
    replyCount: 0,
    latestReplyAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(threadsRef, newThreadData);
  return { id: docRef.id, ...newThreadData, createdAt: new Date() } as Thread;
}

export async function getThread(threadId: string): Promise<Thread | null> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
        notFound();
        return null;
    }
    const data = threadSnap.data();
    return {
        id: threadSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as Thread;
}

export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const { firestore } = initializeFirebase();
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Reply;
    });
}

type ReplyData = {
  threadId: string;
  authorId: string;
  body: string;
  parentReplyId: string | null;
}
export async function createReply(data: ReplyData): Promise<void> {
  const { firestore } = initializeFirebase();
  const threadRef = doc(firestore, 'threads', data.threadId);
  const replyRef = collection(threadRef, 'replies');

  await runTransaction(firestore, async (transaction) => {
    // 1. Get thread author for nested reply case
    let replyToAuthorId: string | undefined = undefined;
    if(data.parentReplyId) {
        const parentReplyRef = doc(firestore, 'threads', data.threadId, 'replies', data.parentReplyId);
        const parentReplySnap = await transaction.get(parentReplyRef);
        if(parentReplySnap.exists()) {
            replyToAuthorId = parentReplySnap.data().authorId;
        }
    }

    // 2. Create the new reply
    const newReply: Omit<Reply, 'id'> = {
      threadId: data.threadId,
      authorId: data.authorId,
      body: data.body,
      parentReplyId: data.parentReplyId,
      replyToAuthorId,
      status: 'published',
      createdAt: serverTimestamp() as Timestamp,
    };
    transaction.set(doc(replyRef), newReply);

    // 3. Update thread metadata
    transaction.update(threadRef, {
      replyCount: increment(1),
      latestReplyAt: serverTimestamp()
    });
  });
}

// For live chat messages within a thread
export async function createChatMessage(threadId: string, messageData: Partial<ChatMessage>): Promise<void> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);

    const threadSnap = await getDoc(threadRef);
    if (!threadSnap.exists() || threadSnap.data().isLocked) {
        throw new Error("This thread is locked or does not exist.");
    }
    
    // Fetch sender's profile for denormalization
    const senderProfile = await getUserProfile(messageData.senderId!);
    
    const messagesRef = collection(firestore, 'threads', threadId, 'chatMessages');
    await addDoc(messagesRef, {
        ...messageData,
        createdAt: serverTimestamp(),
        senderProfile: {
            displayName: senderProfile?.displayName || 'Unknown',
            avatarUrl: senderProfile?.avatarUrl || null,
        }
    });
}

export async function toggleThreadLock(threadId: string, lock: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isLocked: lock });
}

export async function toggleThreadPin(threadId: string, pin: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isPinned: pin });
}

export async function toggleMuteUser(uid: string, mute: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { isMuted: mute });
}

export async function toggleBanUser(uid: string, ban: boolean): Promise<void> {
    const admin = await initializeFirebaseAdmin();
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);

    await admin.auth().updateUser(uid, { disabled: ban });
    await updateDoc(userRef, { isBanned: ban });
}


export async function updateUserRole(uid: string, role: 'admin' | 'member'): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { role: role });
}

export async function createChatGroup(name: string, type: 'public' | 'private', ownerId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupsRef = collection(firestore, 'groups');
    const newGroupData: Omit<Group, 'id'> = {
        name,
        type,
        createdBy: ownerId,
        createdAt: serverTimestamp(),
        memberCount: 1,
        members: {
            [ownerId]: 'owner'
        }
    };
    await addDoc(groupsRef, newGroupData);
}

export async function joinChatGroup(groupId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);

    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist.");
        }

        const groupData = groupDoc.data();
        if (groupData.members && groupData.members[userId]) {
            // User is already a member, do nothing.
            return;
        }

        transaction.update(groupRef, {
            [`members.${userId}`]: 'member',
            memberCount: increment(1)
        });
    });
}

export async function sendChatMessage(groupId: string, senderId: string, content: { type: 'text'; text: string } | { type: 'image'; imageUrl: string }): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);
    const messagesRef = collection(groupRef, 'messages');
    
    // Fetch sender's profile for denormalization
    const senderProfile = await getUserProfile(senderId);
    if (!senderProfile) {
        throw new Error("Sender profile not found.");
    }

    const messageData = {
        senderId,
        type: content.type,
        ...(content.type === 'text' && { text: content.text }),
        ...(content.type === 'image' && { imageUrl: content.imageUrl }),
        createdAt: serverTimestamp(),
        senderProfile: {
            displayName: senderProfile.displayName,
            avatarUrl: senderProfile.avatarUrl,
        }
    };
    await addDoc(messagesRef, messageData);

    const lastMessage = content.type === 'text' 
        ? { text: content.text, sender: senderProfile.displayName, timestamp: serverTimestamp() }
        : { text: 'Sent an image', sender: senderProfile.displayName, timestamp: serverTimestamp() };
    
    await updateDoc(groupRef, { lastMessage });
}

export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    const admin = await initializeFirebaseAdmin();
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);

    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group not found.");
        }
        
        const groupData = groupDoc.data() as Group;
        if (!groupData.members[userId]) {
            return; // User is not a member
        }
        
        // Remove the member from the map
        const newMembers = { ...groupData.members };
        delete newMembers[userId];

        transaction.update(groupRef, {
            members: newMembers,
            memberCount: increment(-1)
        });
    });
}

export async function updateUserGroupRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);
    
    await updateDoc(groupRef, {
      [`members.${userId}`]: role
    });
}

export async function createPost(authorId: string, content: string, visibility: 'public', media?: string[]): Promise<void> {
  const { firestore } = initializeFirebase();
  const postRef = collection(firestore, 'posts');

  const newPost: Omit<Post, 'id' | 'author'> = {
    authorId,
    content,
    visibility,
    media: media || [],
    status: 'active',
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    repostsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await addDoc(postRef, newPost);
}

export async function toggleLikePost(postId: string, userId: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const postRef = doc(firestore, 'posts', postId);
  const likeRef = doc(postRef, 'likes', userId);

  await runTransaction(firestore, async (transaction) => {
    const likeDoc = await transaction.get(likeRef);
    if (likeDoc.exists()) {
      // Unlike
      transaction.delete(likeRef);
      transaction.update(postRef, { likesCount: increment(-1) });
    } else {
      // Like
      transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
      transaction.update(postRef, { likesCount: increment(1) });
    }
  });
}

export async function createComment(postId: string, authorId: string, content: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const postRef = doc(firestore, 'posts', postId);
  const commentRef = collection(postRef, 'comments');

  const newComment = {
    postId,
    authorId,
    content,
    parentCommentId: null,
    createdAt: serverTimestamp()
  };

  await addDoc(commentRef, newComment);
  await updateDoc(postRef, { commentsCount: increment(1) });
}

export async function sharePost(postId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const postRef = doc(firestore, 'posts', postId);
    await updateDoc(postRef, { sharesCount: increment(1) });
}

export async function getAvailableTimeSlots(date: Date): Promise<string[]> {
  const { firestore } = initializeFirebase();
  const bookingsRef = collection(firestore, 'demoBookings');

  // Use a string format for querying dates to avoid timezone issues.
  const dateString = date.toISOString().split('T')[0];

  const q = query(
    bookingsRef,
    where('date', '==', dateString)
  );

  const querySnapshot = await getDocs(q);
  const bookedSlots = querySnapshot.docs.map(doc => doc.data().startTime as string);

  // Business hours: 9 AM to 5 PM local time for the server
  const availableSlots: string[] = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      if (!bookedSlots.includes(time)) {
        availableSlots.push(time);
      }
    }
  }
  return availableSlots;
}

type BookingDetails = {
    date: Date;
    startTime: string;
    duration: number;
    name: string;
    email: string;
    notes: string;
}

export async function bookDemo(details: BookingDetails): Promise<void> {
    const { firestore } = initializeFirebase();
    const bookingsRef = collection(firestore, 'demoBookings');

    const dateString = details.date.toISOString().split('T')[0];
    
    // Check for double booking
    const q = query(
        bookingsRef,
        where('date', '==', dateString),
        where('startTime', '==', details.startTime)
    );
    const existingBookings = await getDocs(q);
    if (!existingBookings.empty) {
        throw new Error('This time slot has just been booked. Please select another time.');
    }

    await addDoc(bookingsRef, {
        date: dateString,
        startTime: details.startTime,
        duration: details.duration,
        name: details.name,
        email: details.email,
        notes: details.notes,
        status: 'scheduled',
        createdAt: serverTimestamp(),
    });
}
