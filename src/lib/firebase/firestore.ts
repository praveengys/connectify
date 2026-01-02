
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, Thread, Reply, Post, PostComment, Group, ChatMessage } from '@/lib/types';
import { startOfDay, endOfDay, format } from 'date-fns';

/**
 * Creates or updates a user profile in Firestore.
 * @param uid - The user's unique ID.
 * @param data - The user profile data.
 */
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  await setDoc(userRef, data, { merge: true });
}

/**
 * Retrieves a user profile from Firestore.
 * @param uid - The user's unique ID.
 * @returns The user profile data or null if not found.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      uid: docSnap.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
      lastActiveAt: (data.lastActiveAt as Timestamp)?.toDate() ?? new Date(),
    } as UserProfile;
  } else {
    return null;
  }
}

/**
 * Updates a user profile in Firestore.
 * @param uid - The user's unique ID.
 * @param data - The user profile data to update.
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
}

/**
 * Toggles a user's role between 'member' and 'admin'.
 * @param uid The user's ID.
 * @param role The new role to assign.
 */
export async function updateUserRole(uid: string, role: 'admin' | 'member'): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { role, updatedAt: serverTimestamp() });
}

/**
 * Toggles a user's mute status.
 * @param uid The user's ID.
 * @param isMuted The new mute status.
 */
export async function toggleMuteUser(uid: string, isMuted: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { isMuted, updatedAt: serverTimestamp() });
}

/**
 * Toggles a user's ban status.
 * @param uid The user's ID.
 * @param isBanned The new ban status.
 */
export async function toggleBanUser(uid: string, isBanned: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { isBanned, updatedAt: serverTimestamp() });
}


/**
 * Creates a new forum.
 * @param name The name of the forum.
 * @param description A short description of the forum.
 * @param createdBy The UID of the user creating the forum.
 * @returns The newly created forum object.
 */
export async function createForum(name: string, description: string, createdBy: string): Promise<Forum> {
  const { firestore } = initializeFirebase();
  const forumsRef = collection(firestore, 'forums');
  const newForumData = {
    name,
    description,
    createdBy,
    createdAt: serverTimestamp(),
    visibility: 'public' as const,
    status: 'active' as const,
    threadCount: 0,
    latestThread: null,
  };
  const docRef = await addDoc(forumsRef, newForumData);
  return { id: docRef.id, ...newForumData, createdAt: new Date() } as Forum;
}

/**
 * Gets or creates a category by name.
 * @param name The name of the category.
 * @returns The category object.
 */
export async function getOrCreateCategory(name: string): Promise<Category | null> {
  const { firestore } = initializeFirebase();
  const categoriesRef = collection(firestore, 'categories');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const q = query(categoriesRef, where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Category;
  } else {
    const newCategoryData = {
      name,
      slug,
      description: `Discussions related to ${name}`,
      threadCount: 0,
    };
    const docRef = await addDoc(categoriesRef, newCategoryData);
    return { id: docRef.id, ...newCategoryData };
  }
}

type CreateThreadData = Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt' | 'author'>;

/**
 * Creates a new thread in a forum.
 * @param data - The data for the new thread.
 * @returns The newly created thread object.
 */
export async function createThread(data: CreateThreadData): Promise<Thread> {
  const { firestore } = initializeFirebase();
  const threadRef = collection(firestore, 'threads');
  
  const newThreadData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    replyCount: 0,
    latestReplyAt: null,
  };

  const docRef = await addDoc(threadRef, newThreadData);

  return {
    id: docRef.id,
    ...newThreadData,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Thread;
}

/**
 * Retrieves a single thread by its ID.
 * @param threadId The ID of the thread to fetch.
 */
export async function getThread(threadId: string): Promise<Thread | null> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    const docSnap = await getDoc(threadRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
            id: docSnap.id, 
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
        } as Thread;
    }
    return null;
}

/**
 * Toggles the lock status of a thread.
 * @param threadId The ID of the thread.
 * @param isLocked The new lock status.
 */
export async function toggleThreadLock(threadId: string, isLocked: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isLocked, updatedAt: serverTimestamp() });
}

/**
 * Toggles the pin status of a thread.
 * @param threadId The ID of the thread.
 * @param isPinned The new pin status.
 */
export async function toggleThreadPin(threadId: string, isPinned: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isPinned, updatedAt: serverTimestamp() });
}

type CreateReplyData = {
  threadId: string;
  authorId: string;
  body: string;
  parentReplyId: string | null;
};

/**
 * Creates a new reply in a thread.
 * @param data - The data for the new reply.
 */
export async function createReply(data: CreateReplyData): Promise<void> {
  const { firestore } = initializeFirebase();
  const threadRef = doc(firestore, 'threads', data.threadId);
  const repliesRef = collection(firestore, 'threads', data.threadId, 'replies');
  
  const newReplyData = {
    authorId: data.authorId,
    body: data.body,
    parentReplyId: data.parentReplyId,
    status: 'published' as const,
    createdAt: serverTimestamp(),
  };

  await runTransaction(firestore, async (transaction) => {
    transaction.update(threadRef, {
        replyCount: (await transaction.get(threadRef)).data()?.replyCount + 1,
        latestReplyAt: serverTimestamp(),
    });
    transaction.set(doc(repliesRef), newReplyData);
  });
}

/**
 * Retrieves all replies for a given thread.
 * @param threadId The ID of the thread.
 */
export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const { firestore } = initializeFirebase();
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() ?? new Date(),
    } as Reply));
}

/**
 * Creates a new chat message in a thread.
 * @param threadId The ID of the thread.
 * @param messageData The message data.
 */
export async function createChatMessage(threadId: string, messageData: { senderId: string; text: string; }): Promise<void> {
    const { firestore } = initializeFirebase();
    const messageRef = collection(firestore, 'threads', threadId, 'chatMessages');

    const authorProfile = await getUserProfile(messageData.senderId);

    await addDoc(messageRef, {
        ...messageData,
        createdAt: serverTimestamp(),
        senderProfile: {
            displayName: authorProfile?.displayName || 'Anonymous',
            avatarUrl: authorProfile?.avatarUrl || null,
        }
    });
}

/**
 * Creates a new post in the activity feed.
 * @param authorId The UID of the post author.
 * @param content The text content of the post.
 * @param status The status of the post.
 * @param media An array of media URLs (optional).
 */
export async function createPost(authorId: string, content: string, status: Post['status'], media: string[] = []): Promise<void> {
  const { firestore } = initializeFirebase();
  const postsRef = collection(firestore, 'posts');

  const newPostData = {
    authorId,
    content,
    status,
    media,
    visibility: 'public' as const,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    repostsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await addDoc(postsRef, newPostData);
}

/**
 * Toggles a like on a post for a user.
 * @param postId The ID of the post.
 * @param userId The ID of the user liking/unliking the post.
 */
export async function toggleLikePost(postId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const postRef = doc(firestore, 'posts', postId);
    const likeRef = doc(firestore, 'posts', postId, 'likes', userId);

    await runTransaction(firestore, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        const postDoc = await transaction.get(postRef);

        if (!postDoc.exists()) {
            throw new Error("Post does not exist.");
        }

        const currentLikes = postDoc.data().likesCount || 0;

        if (likeDoc.exists()) {
            // User is unliking the post
            transaction.delete(likeRef);
            transaction.update(postRef, { likesCount: Math.max(0, currentLikes - 1) });
        } else {
            // User is liking the post
            transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
            transaction.update(postRef, { likesCount: currentLikes + 1 });
        }
    });
}

/**
 * Creates a comment on a post.
 * @param postId The ID of the post to comment on.
 * @param authorId The ID of the comment author.
 * @param content The text content of the comment.
 */
export async function createComment(postId: string, authorId: string, content: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const postRef = doc(firestore, 'posts', postId);
    const commentsRef = collection(firestore, 'posts', postId, 'comments');
    
    await runTransaction(firestore, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
            throw new Error("Post does not exist.");
        }

        const currentComments = postDoc.data().commentsCount || 0;
        transaction.update(postRef, { commentsCount: currentComments + 1 });

        transaction.set(doc(commentsRef), {
            authorId,
            content,
            createdAt: serverTimestamp(),
            parentCommentId: null,
        });
    });
}

/**
 * Shares a post, incrementing its share count.
 * @param postId The ID of the post to share.
 * @param userId The ID of the user sharing the post.
 */
export async function sharePost(postId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const postRef = doc(firestore, 'posts', postId);

    await runTransaction(firestore, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
            throw new Error("Post does not exist.");
        }
        const currentShares = postDoc.data().sharesCount || 0;
        transaction.update(postRef, { sharesCount: currentShares + 1 });
    });
}


// --- Chat Group Functions ---

/**
 * Creates a new chat group.
 * @param name The name of the group.
 * @param type The type of the group ('public' or 'private').
 * @param ownerId The UID of the user creating the group.
 */
export async function createChatGroup(name: string, type: 'public' | 'private', ownerId: string): Promise<Group> {
  const { firestore } = initializeFirebase();
  const groupsRef = collection(firestore, 'groups');
  
  const newGroupData = {
    name,
    type,
    createdBy: ownerId,
    createdAt: serverTimestamp(),
    memberCount: 1,
    members: {
      [ownerId]: 'owner' as const,
    },
  };
  
  const docRef = await addDoc(groupsRef, newGroupData);
  return { id: docRef.id, ...newGroupData, createdAt: new Date() } as Group;
}

/**
 * Sends a message in a chat group.
 * @param groupId The ID of the group.
 * @param senderId The UID of the message sender.
 * @param message The message content.
 */
export async function sendChatMessage(
  groupId: string,
  senderId: string,
  message: { type: 'text', text: string } | { type: 'image', imageUrl: string }
): Promise<void> {
  const { firestore } = initializeFirebase();
  const messagesRef = collection(firestore, 'groups', groupId, 'messages');
  const groupRef = doc(firestore, 'groups', groupId);

  const authorProfile = await getUserProfile(senderId);
  const senderProfile = {
      displayName: authorProfile?.displayName || 'User',
      avatarUrl: authorProfile?.avatarUrl || null,
  };

  const messageData: Partial<ChatMessage> = {
    senderId,
    ...message,
    createdAt: serverTimestamp(),
    senderProfile: senderProfile,
    status: 'visible'
  };

  await addDoc(messagesRef, messageData);

  // Update last message on the group for previews
  await updateDoc(groupRef, {
    lastMessage: {
      text: message.type === 'text' ? message.text : 'Sent an image',
      sender: senderProfile.displayName,
      timestamp: serverTimestamp(),
    },
  });
}

/**
 * Adds a user to a chat group.
 * @param groupId The ID of the group.
 * @param userId The ID of the user to add.
 */
export async function joinChatGroup(groupId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);

    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist.");
        }

        const groupData = groupDoc.data() as Group;
        if (groupData.members[userId]) {
           // User is already a member, do nothing.
           return;
        }

        const newMemberCount = (groupData.memberCount || 0) + 1;
        const newMembers = { ...groupData.members, [userId]: 'member' as const };

        transaction.update(groupRef, {
            memberCount: newMemberCount,
            members: newMembers,
        });
    });
}

/**
 * Removes a user from a group.
 * @param groupId The ID of the group.
 * @param userId The ID of the user to remove.
 */
export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);

    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group not found");
        }
        const data = groupDoc.data();
        const members = { ...data.members };
        if (!members[userId]) {
            return; // User not in group
        }
        delete members[userId];
        const newMemberCount = Object.keys(members).length;

        transaction.update(groupRef, {
            members,
            memberCount: newMemberCount,
        });
    });
}

/**
 * Updates a user's role within a group.
 * @param groupId The ID of the group.
 * @param userId The ID of the user.
 * @param role The new role to assign.
 */
export async function updateUserGroupRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);
     await updateDoc(groupRef, {
        [`members.${userId}`]: role
    });
}


// --- Demo Booking Functions ---

interface DemoBooking {
    date: Date;
    startTime: string; // "HH:mm"
    duration: number;
    name: string;
    email: string;
    notes?: string;
}

/**
 * Books a demo and saves it to Firestore.
 * @param bookingDetails The details of the demo booking.
 */
export async function bookDemo(bookingDetails: DemoBooking): Promise<void> {
  const { firestore } = initializeFirebase();
  const bookingsRef = collection(firestore, 'demoBookings');

  await addDoc(bookingsRef, {
    ...bookingDetails,
    date: Timestamp.fromDate(startOfDay(bookingDetails.date)),
    status: 'scheduled',
    createdAt: serverTimestamp(),
  });
}

/**
 * Gets all available time slots for a given day.
 * @param date The date to check for available slots.
 * @returns An array of time strings in "HH:mm" format.
 */
export async function getAvailableTimeSlots(date: Date): Promise<string[]> {
  const { firestore } = initializeFirebase();
  const bookingsRef = collection(firestore, 'demoBookings');

  // Fetch all bookings for the selected day
  const start = Timestamp.fromDate(startOfDay(date));
  const end = Timestamp.fromDate(endOfDay(date));
  const q = query(bookingsRef, where('date', '>=', start), where('date', '<=', end));
  const snapshot = await getDocs(q);
  const bookedTimes = snapshot.docs.map(doc => doc.data().startTime);

  // Generate all possible slots for the day
  const allSlots: string[] = [];
  const workingHoursStart = 9;
  const workingHoursEnd = 17;
  const slotDuration = 30;
  const buffer = 15;
  
  for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
    for (let minute = 0; minute < 60; minute += (slotDuration + buffer)) {
        if (hour === (workingHoursEnd -1) && minute >= (60 - slotDuration)) continue;
        
        // Ensure slots are aligned to our interval
        if (minute % 15 === 0) {
             const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
             allSlots.push(time);
        }
    }
  }

  // Filter out booked slots
  const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
  
  return availableSlots;
}
