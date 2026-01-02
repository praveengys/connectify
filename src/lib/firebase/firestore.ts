
'use client';

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type {
  Category,
  Forum,
  Post,
  Reply,
  Thread,
  UserProfile,
} from '../types';

// This file contains Firestore interactions that can be executed from the client.
// For admin-level or sensitive operations, use functions from 'src/lib/firebase/admin.ts' in server-side code.

const { firestore } = initializeFirebase();

// USER PROFILE FUNCTIONS
export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
) {
  const defaultProfile: UserProfile = {
    uid,
    displayName: data.displayName || 'New User',
    username:
      data.username ||
      `user_${Math.random().toString(36).substring(2, 10)}`,
    bio: data.bio || '',
    avatarUrl: data.avatarUrl || null,
    role: 'member',
    email: data.email || null,
    profileVisibility: 'public',
    emailVerified: data.emailVerified || false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
    profileScore: 0,
    postCount: 0,
    commentCount: 0,
    interests: [],
    skills: [],
    languages: [],
    location: '',
    currentlyExploring: '',
    company: '',
  };
  await setDoc(doc(firestore, 'users', uid), defaultProfile);
  return defaultProfile;
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const docRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      uid: docSnap.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
      lastActiveAt: (data.lastActiveAt as Timestamp)?.toDate() ?? new Date(),
    } as UserProfile;
  }
  return null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
) {
  const userRef = doc(firestore, 'users', uid);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(userRef, updateData);
}

// Admin-facing user management functions
export const toggleMuteUser = async (uid: string, isMuted: boolean) => {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { isMuted });
};

export const toggleBanUser = async (uid: string, isBanned: boolean) => {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { isBanned });
};

export const updateUserRole = async (uid: string, role: 'admin' | 'member') => {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { role });
};


// GROUP & CHAT FUNCTIONS
export async function createChatGroup(name: string, type: 'public' | 'private', ownerId: string) {
    const groupData = {
        name,
        type,
        createdBy: ownerId,
        createdAt: serverTimestamp(),
        memberCount: 1,
        members: {
            [ownerId]: 'owner'
        }
    };
    await addDoc(collection(firestore, 'groups'), groupData);
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

export const sendChatMessage = async (groupId: string, senderId: string, message: { type: 'text', text: string } | { type: 'image', imageUrl: string }) => {
    const { firestore } = initializeFirebase();
    const userProfile = await getUserProfile(senderId);
    
    if (!userProfile) {
        throw new Error('User profile not found.');
    }

    const messagesRef = collection(firestore, 'groups', groupId, 'messages');
    const messageData: any = {
        ...message,
        senderId,
        createdAt: serverTimestamp(),
        senderProfile: { // Denormalize for performance
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl,
        }
    };
    await addDoc(messagesRef, messageData);
}

export const removeUserFromGroup = async (groupId: string, userId: string) => {
    const groupRef = doc(firestore, 'groups', groupId);
     await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist!");
        }

        const currentMembers = groupDoc.data().members || {};
        if (!currentMembers[userId]) {
            // User is not a member, do nothing.
            return;
        }
        
        delete currentMembers[userId];
        const newMemberCount = Object.keys(currentMembers).length;

        transaction.update(groupRef, {
            members: currentMembers,
            memberCount: newMemberCount
        });
    });
}

export const updateUserGroupRole = async (groupId: string, userId: string, newRole: 'admin' | 'member') => {
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: newRole
    });
};

// FORUM, THREAD, & REPLY FUNCTIONS
export async function createForum(
  name: string,
  description: string,
  creatorId: string
) {
  const forumData = {
    name,
    description,
    createdBy: creatorId,
    createdAt: serverTimestamp(),
    visibility: 'public', // Default to public
    status: 'active',
  };
  const docRef = await addDoc(collection(firestore, 'forums'), forumData);
  return { id: docRef.id, ...forumData, createdAt: new Date() } as Forum;
}

export async function getOrCreateCategory(
  name: string
): Promise<Category | null> {
  const categoriesRef = collection(firestore, 'categories');
  const q = query(categoriesRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Category;
  } else {
    const newCategoryData = {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Discussions about ${name}`,
      threadCount: 0,
    };
    const docRef = await addDoc(categoriesRef, newCategoryData);
    return { id: docRef.id, ...newCategoryData } as Category;
  }
}

export async function createThread(data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt'>) {
    const threadData = {
        ...data,
        replyCount: 0,
        latestReplyAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const threadRef = await addDoc(collection(firestore, 'threads'), threadData);

    // Update category thread count
    const categoryRef = doc(firestore, 'categories', data.categoryId);
    await updateDoc(categoryRef, { threadCount: increment(1) });

    return { id: threadRef.id, ...threadData, createdAt: new Date(), updatedAt: new Date() } as Thread;
}

export async function getThread(threadId: string): Promise<Thread | null> {
    const threadRef = doc(firestore, 'threads', threadId);
    const docSnap = await getDoc(threadRef);
    if(docSnap.exists()){
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
            updatedAt: (data.updatedAt as Timestamp).toDate(),
        } as Thread;
    }
    return null;
}

export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate()
    } as Reply));
}

export async function createReply(data: {
  threadId: string;
  authorId: string;
  body: string;
  parentReplyId: string | null;
}) {
  const { threadId, authorId, body, parentReplyId } = data;
  const threadRef = doc(firestore, 'threads', threadId);

  const replyData = {
    threadId,
    authorId,
    body,
    parentReplyId,
    status: 'published' as const,
    createdAt: serverTimestamp(),
  };
  
  await addDoc(collection(threadRef, 'replies'), replyData);

  await updateDoc(threadRef, {
    replyCount: increment(1),
    latestReplyAt: serverTimestamp(),
  });
}

export const createChatMessage = async (threadId: string, message: { senderId: string, text: string }) => {
    const { firestore } = initializeFirebase();
    const userProfile = await getUserProfile(message.senderId);
    
    if (!userProfile) {
        throw new Error('User profile not found.');
    }

    const messagesRef = collection(firestore, 'threads', threadId, 'chatMessages');
    const messageData = {
        ...message,
        createdAt: serverTimestamp(),
        senderProfile: { // Denormalize for performance
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl,
        }
    };
    await addDoc(messagesRef, messageData);
}

export const toggleThreadLock = async (threadId: string, isLocked: boolean) => {
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isLocked });
}

export const toggleThreadPin = async (threadId: string, isPinned: boolean) => {
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isPinned });
}

// POSTS, LIKES, COMMENTS (FEED)
export async function createPost(
  authorId: string,
  content: string,
  visibility: 'public' | 'group-only' = 'public',
  media: string[] = []
) {
  const postData = {
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
  };
  await addDoc(collection(firestore, 'posts'), postData);

  // Increment user's post count
  const userRef = doc(firestore, 'users', authorId);
  await updateDoc(userRef, { postCount: increment(1) });
}

export async function toggleLikePost(postId: string, userId: string) {
  const postRef = doc(firestore, 'posts', postId);
  const likeRef = doc(firestore, 'posts', postId, 'likes', userId);

  await runTransaction(firestore, async (transaction) => {
    const likeDoc = await transaction.get(likeRef);
    if (likeDoc.exists()) {
      // User has already liked, so unlike
      transaction.delete(likeRef);
      transaction.update(postRef, { likesCount: increment(-1) });
    } else {
      // User has not liked yet, so like
      transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
      transaction.update(postRef, { likesCount: increment(1) });
    }
  });
}

export async function createComment(postId: string, authorId: string, content: string) {
    const postRef = doc(firestore, 'posts', postId);
    const commentRef = collection(postRef, 'comments');
    const userRef = doc(firestore, 'users', authorId);

    const commentData = {
        postId,
        authorId,
        content,
        parentCommentId: null,
        createdAt: serverTimestamp(),
    };

    await addDoc(commentRef, commentData);
    
    // Use a transaction to update both post and user counts
    await runTransaction(firestore, async (transaction) => {
        transaction.update(postRef, { commentsCount: increment(1) });
        transaction.update(userRef, { commentCount: increment(1) });
    });
}

export async function sharePost(postId: string, userId: string) {
  const postRef = doc(firestore, 'posts', postId);
  await updateDoc(postRef, { sharesCount: increment(1) });
  // In a real app, you might also create a notification or activity log for this user.
}

export async function repostPost(originalPostId: string, reposterId: string) {
  const originalPostRef = doc(firestore, 'posts', originalPostId);
  const reposterUserRef = doc(firestore, 'users', reposterId);

  await runTransaction(firestore, async (transaction) => {
    const originalPostDoc = await transaction.get(originalPostRef);
    if (!originalPostDoc.exists()) {
      throw new Error("Original post does not exist.");
    }

    const originalPostData = originalPostDoc.data() as Post;

    // Prevent reposting a repost
    if (originalPostData.isRepost) {
      throw new Error("You cannot repost a repost.");
    }

    // Denormalize original author data
    const originalAuthorProfile = await getUserProfile(originalPostData.authorId);

    const newPostData = {
      authorId: reposterId, // The author of the repost is the current user
      content: originalPostData.content,
      media: originalPostData.media,
      visibility: originalPostData.visibility,
      status: 'active',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      repostsCount: 0, // Reposts of a repost are not counted on the new post
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isRepost: true,
      originalPostId: originalPostId,
      originalPostCreatedAt: originalPostData.createdAt,
      originalAuthor: { // Denormalize for easy display
        displayName: originalAuthorProfile?.displayName,
        avatarUrl: originalAuthorProfile?.avatarUrl,
        username: originalAuthorProfile?.username,
      }
    };
    
    // Create the new post document (the repost)
    const postsCollection = collection(firestore, 'posts');
    transaction.set(doc(postsCollection), newPostData);

    // Increment reposts count on the original post
    transaction.update(originalPostRef, { repostsCount: increment(1) });
    
    // Increment the reposter's post count
    transaction.update(reposterUserRef, { postCount: increment(1) });
  });
}
