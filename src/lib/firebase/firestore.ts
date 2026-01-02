
'use client';

import {
  getFirestore,
  doc,
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  writeBatch,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import {
  type Forum,
  type Thread,
  type Reply,
  type Category,
  type UserProfile,
  type ChatMessage,
  type Group,
  type Post,
  type PostComment,
} from '../types';

// Initialize Firebase
const { firestore } = initializeFirebase();

/**
 * Creates a new user profile document in Firestore.
 * This is typically called when a new user signs up.
 */
export async function createUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
}) {
  const userRef = doc(firestore, 'users', user.uid);
  const username = user.email ? user.email.split('@')[0] : `user_${user.uid.substring(0, 6)}`;
  const profile: UserProfile = {
    uid: user.uid,
    username: username,
    displayName: user.displayName || username,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    bio: '',
    interests: [],
    skills: [],
    languages: [],
    location: '',
    currentlyExploring: '',
    role: 'member',
    profileVisibility: 'public',
    emailVerified: false,
    profileScore: 0,
    postCount: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
  await setDoc(userRef, profile);
  return profile;
}

/**
 * Retrieves a user's profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      uid: docSnap.id,
      createdAt: (data.createdAt as any)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as any)?.toDate() ?? new Date(),
      lastActiveAt: (data.lastActiveAt as any)?.toDate() ?? new Date(),
    } as UserProfile;
  }
  return null;
}

/**
 * Updates a user's profile data in Firestore.
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Creates a new forum.
 */
export async function createForum(
  name: string,
  description: string,
  creatorId: string
): Promise<Forum> {
  const forumsRef = collection(firestore, 'forums');
  const newForumDoc = await addDoc(forumsRef, {
    name,
    description,
    createdBy: creatorId,
    visibility: 'public',
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return {
    id: newForumDoc.id,
    name,
    description,
    createdBy: creatorId,
    visibility: 'public',
    status: 'active',
    createdAt: new Date(),
  };
}

/**
 * Gets or creates a category.
 */
export async function getOrCreateCategory(categoryName: string): Promise<Category> {
  const categoriesRef = collection(firestore, 'categories');
  const q = query(categoriesRef, where('name', '==', categoryName));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Category;
  } else {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    const newCategoryData = {
      name: categoryName,
      slug: slug,
      description: `Discussions related to ${categoryName}`,
      threadCount: 0,
    };
    const newCategoryRef = await addDoc(categoriesRef, newCategoryData);
    return { id: newCategoryRef.id, ...newCategoryData } as Category;
  }
}

/**
 * Creates a new discussion thread.
 */
export async function createThread(threadData: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt' | 'author'>): Promise<Thread> {
    const threadRef = collection(firestore, "threads");
    const newThreadRef = doc(threadRef);

    const finalThreadData = {
        ...threadData,
        replyCount: 0,
        latestReplyAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(newThreadRef, finalThreadData);
    
    // Also update category thread count
    const categoryRef = doc(firestore, 'categories', threadData.categoryId);
    await updateDoc(categoryRef, {
        threadCount: increment(1)
    });

    return {
        id: newThreadRef.id,
        ...finalThreadData,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as Thread;
}

/**
 * Retrieves a single thread by its ID.
 */
export async function getThread(threadId: string): Promise<Thread | null> {
    const threadRef = doc(firestore, 'threads', threadId);
    const docSnap = await getDoc(threadRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
         } as Thread;
    }
    return null;
}

/**
 * Retrieves all replies for a given thread.
 */
export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    } as Reply));
}


/**
 * Creates a new reply in a thread.
 */
export async function createReply(replyData: {
  threadId: string;
  authorId: string;
  body: string;
  parentReplyId: string | null;
}) {
  const { threadId, ...rest } = replyData;
  const replyRef = collection(firestore, 'threads', threadId, 'replies');
  
  const finalReplyData = {
    ...rest,
    status: 'published' as const,
    createdAt: serverTimestamp(),
  };

  const batch = writeBatch(firestore);

  // Add new reply
  const newReplyRef = doc(replyRef);
  batch.set(newReplyRef, finalReplyData);
  
  // Update thread metadata
  const threadRef = doc(firestore, 'threads', threadId);
  batch.update(threadRef, {
      replyCount: increment(1),
      latestReplyAt: serverTimestamp()
  });

  await batch.commit();

  return { id: newReplyRef.id, ...finalReplyData, createdAt: new Date() } as Reply;
}

export async function createChatMessage(threadId: string, messageData: Partial<ChatMessage>) {
    const messagesRef = collection(firestore, 'threads', threadId, 'chatMessages');
    const senderProfile = await getUserProfile(messageData.senderId!);
    await addDoc(messagesRef, {
      ...messageData,
      status: 'visible',
      createdAt: serverTimestamp(),
      senderProfile: senderProfile ? {
        displayName: senderProfile.displayName,
        avatarUrl: senderProfile.avatarUrl,
      } : {
        displayName: "Unknown User",
        avatarUrl: null,
      }
    });
}

// User moderation functions
export async function toggleMuteUser(uid: string, isMuted: boolean) {
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, { isMuted });
}

export async function toggleBanUser(uid: string, isBanned: boolean) {
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, { isBanned });
}

export async function updateUserRole(uid: string, role: 'admin' | 'member') {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { role });
}


// Thread moderation functions
export async function toggleThreadLock(threadId: string, isLocked: boolean) {
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isLocked });
}

export async function toggleThreadPin(threadId: string, isPinned: boolean) {
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isPinned });
}

// Group chat functions
export async function createChatGroup(name: string, type: 'public' | 'private', creatorId: string) {
    const groupRef = doc(collection(firestore, 'groups'));
    await setDoc(groupRef, {
        name,
        type,
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        memberCount: 1,
        members: {
            [creatorId]: 'owner'
        }
    });
}

export async function joinChatGroup(groupId: string, userId: string) {
    const groupRef = doc(firestore, 'groups', groupId);
    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist!");
        }
        transaction.update(groupRef, {
            memberCount: increment(1),
            [`members.${userId}`]: 'member'
        });
    });
}

export async function removeUserFromGroup(groupId: string, userId: string) {
    const groupRef = doc(firestore, 'groups', groupId);
     await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist!");
        }
        const currentMembers = groupDoc.data().members;
        delete currentMembers[userId];

        transaction.update(groupRef, {
            memberCount: increment(-1),
            members: currentMembers
        });
    });
}

export async function updateUserGroupRole(groupId: string, userId: string, role: 'admin' | 'member') {
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: role
    });
}


// Feed related functions

export async function createPost(authorId: string, content: string, visibility: 'public' | 'group-only', media: string[] = []) {
    const postRef = doc(collection(firestore, 'posts'));
    
    await setDoc(postRef, {
        authorId,
        content,
        visibility,
        media,
        status: 'active',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        repostsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Also increment user's post count
    const userRef = doc(firestore, 'users', authorId);
    await updateDoc(userRef, { postCount: increment(1) });
}

export async function toggleLikePost(postId: string, userId: string) {
  const postRef = doc(firestore, 'posts', postId);
  const likeRef = doc(postRef, 'likes', userId);

  await runTransaction(firestore, async (transaction) => {
    const likeDoc = await transaction.get(likeRef);
    if (likeDoc.exists()) {
      // User has liked the post, so unlike it
      transaction.delete(likeRef);
      transaction.update(postRef, { likesCount: increment(-1) });
    } else {
      // User has not liked the post, so like it
      transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
      transaction.update(postRef, { likesCount: increment(1) });
    }
  });
}

export async function createComment(postId: string, authorId: string, content: string, parentCommentId: string | null = null) {
  const commentRef = doc(collection(firestore, 'posts', postId, 'comments'));
  
  const batch = writeBatch(firestore);

  // 1. Add the new comment
  batch.set(commentRef, {
    postId,
    authorId,
    content,
    parentCommentId,
    createdAt: serverTimestamp(),
  });

  // 2. Increment commentsCount on the post
  const postRef = doc(firestore, 'posts', postId);
  batch.update(postRef, { commentsCount: increment(1) });

  // 3. Increment commentCount on the user's profile
  const userRef = doc(firestore, 'users', authorId);
  batch.update(userRef, { commentCount: increment(1) });

  await batch.commit();
}

export async function sendChatMessage(groupId: string, senderId: string, messageData: Partial<ChatMessage>) {
    const messagesRef = collection(firestore, 'groups', groupId, 'messages');
    const senderProfile = await getUserProfile(senderId);

    const data = {
        ...messageData,
        senderId,
        status: 'visible' as const,
        createdAt: serverTimestamp(),
        senderProfile: senderProfile ? {
            displayName: senderProfile.displayName,
            avatarUrl: senderProfile.avatarUrl,
        } : {
            displayName: "Unknown User",
            avatarUrl: null,
        }
    };
    await addDoc(messagesRef, data);
}

export async function sharePost(postId: string, userId: string) {
    const postRef = doc(firestore, 'posts', postId);
    await updateDoc(postRef, { sharesCount: increment(1) });
    // In a real app, you might also create a notification for the post author.
}
