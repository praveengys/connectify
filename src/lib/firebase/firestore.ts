
'use client';

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Category, Forum, Group, Post, Reply, Thread, UserProfile } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const db = initializeFirebase().firestore;

// USER PROFILE FUNCTIONS
export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
  avatarUrl: string | null
) => {
  const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid,
    email,
    displayName,
    username,
    avatarUrl,
    role: 'member',
    profileVisibility: 'public',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    bio: '',
    interests: [],
    skills: [],
    languages: [],
    location: '',
    currentlyExploring: '',
    emailVerified: false,
    profileScore: 0,
    postCount: 0,
    commentCount: 0,
    lastActiveAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
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
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

export const toggleMuteUser = async (uid: string, isMuted: boolean) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isMuted });
};

export const toggleBanUser = async (uid: string, isBanned: boolean) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isBanned });
};

export const updateUserRole = async (uid: string, role: 'member' | 'admin') => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
};


// FORUM AND THREAD FUNCTIONS
export const createForum = async (name: string, description: string, createdBy: string): Promise<Forum> => {
    const forumsRef = collection(db, 'forums');
    const newForumDoc = await addDoc(forumsRef, {
      name,
      description,
      createdBy,
      visibility: 'public',
      status: 'active',
      createdAt: serverTimestamp(),
    });
    return { id: newForumDoc.id, name, description, createdBy, visibility: 'public', status: 'active', createdAt: new Date() };
};

export const getOrCreateCategory = async (name: string): Promise<Category | null> => {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, where('name', '==', name));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Category;
    } else {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newCategoryDoc = await addDoc(categoriesRef, {
            name,
            slug,
            description: `Discussions related to ${name}`,
            threadCount: 0,
        });
        return { id: newCategoryDoc.id, name, slug, description: `Discussions related to ${name}`, threadCount: 0 };
    }
};

export const createThread = async (threadData: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt'>): Promise<Thread> => {
    const threadsRef = collection(db, 'threads');
    const newThreadRef = await addDoc(threadsRef, {
        ...threadData,
        replyCount: 0,
        latestReplyAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    
    // In a real app, you might use a cloud function to increment forum/category thread counts.
    const forumRef = doc(db, 'forums', threadData.forumId);
    await updateDoc(forumRef, { threadCount: increment(1) });
    
    const categoryRef = doc(db, 'categories', threadData.categoryId);
    await updateDoc(categoryRef, { threadCount: increment(1) });

    return {
        id: newThreadRef.id,
        ...threadData,
        replyCount: 0,
        latestReplyAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

export async function getThread(threadId: string): Promise<Thread | null> {
    const threadRef = doc(db, 'threads', threadId);
    const threadSnap = await getDoc(threadRef);
  
    if (!threadSnap.exists()) {
      return null;
    }
  
    const data = threadSnap.data();
    return {
      id: threadSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Thread;
}

export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const repliesRef = collection(db, 'threads', threadId, 'replies');
    const q = query(repliesRef, where('status', '==', 'published'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as Reply));
}
  
export const createReply = async (replyData: Omit<Reply, 'id' | 'createdAt' | 'status'>) => {
    return runTransaction(db, async (transaction) => {
        const threadRef = doc(db, 'threads', replyData.threadId);
        const threadDoc = await transaction.get(threadRef);

        if (!threadDoc.exists() || threadDoc.data().isLocked) {
            throw new Error("Thread does not exist or is locked.");
        }

        const newReplyRef = doc(collection(db, 'threads', replyData.threadId, 'replies'));
        transaction.set(newReplyRef, {
            ...replyData,
            status: 'published',
            createdAt: serverTimestamp(),
        });
        
        transaction.update(threadRef, {
            replyCount: increment(1),
            latestReplyAt: serverTimestamp(),
        });
    });
};

export const createChatMessage = async (threadId: string, messageData: { senderId: string, text: string }) => {
    const messagesRef = collection(db, 'threads', threadId, 'chatMessages');
    const senderProfile = await getUserProfile(messageData.senderId);

    if (!senderProfile) {
        throw new Error("User profile not found.");
    }

    const { displayName, avatarUrl } = senderProfile;

    await addDoc(messagesRef, {
      ...messageData,
      createdAt: serverTimestamp(),
      senderProfile: { displayName, avatarUrl } // Denormalize
    });
};

export const toggleThreadLock = async (threadId: string, isLocked: boolean) => {
    const threadRef = doc(db, 'threads', threadId);
    await updateDoc(threadRef, { isLocked });
};

export const toggleThreadPin = async (threadId: string, isPinned: boolean) => {
    const threadRef = doc(db, 'threads', threadId);
    await updateDoc(threadRef, { isPinned });
};

export const deleteThread = async (threadId: string) => {
    // This is a simplified delete. A real-world scenario would involve
    // either soft-deleting or using a Cloud Function to delete subcollections.
    const threadRef = doc(db, 'threads', threadId);
    await deleteDoc(threadRef);
};


// CHAT GROUP FUNCTIONS
export const createChatGroup = async (name: string, type: 'public' | 'private', ownerId: string) => {
    const groupsRef = collection(db, 'groups');
    await addDoc(groupsRef, {
        name,
        type,
        createdBy: ownerId,
        createdAt: serverTimestamp(),
        memberCount: 1,
        members: {
            [ownerId]: 'owner'
        }
    });
};

export const joinChatGroup = async (groupId: string, userId: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: 'member',
        memberCount: increment(1)
    });
};

export const sendChatMessage = async (groupId: string, senderId: string, message: { type: 'text', text: string } | { type: 'image', imageUrl: string }) => {
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const userProfile = await getUserProfile(senderId);

    if (!userProfile) throw new Error("Sender profile not found.");

    await addDoc(messagesRef, {
        senderId,
        senderProfile: {
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl,
        },
        ...message,
        createdAt: serverTimestamp(),
        reactions: {},
        status: 'visible',
    });

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      lastMessage: {
        text: message.type === 'text' ? message.text : '📷 Image',
        sender: userProfile.displayName,
        timestamp: serverTimestamp(),
      }
    });
};

export const deleteGroup = async (groupId: string) => {
    // This is a simplified version. A robust solution uses Cloud Functions
    // to recursively delete subcollections like messages and members.
    const groupRef = doc(db, 'groups', groupId);
    await deleteDoc(groupRef);
};

export const removeUserFromGroup = async (groupId: string, userId: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: deleteDoc, // Firestore field deletion
        memberCount: increment(-1)
    });
};

export const updateUserGroupRole = async (groupId: string, userId: string, role: 'admin' | 'member') => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: role
    });
};

// FEED AND POST FUNCTIONS

export const createPost = async (authorId: string, content: string, status: 'active' | 'draft', media: string[] = []) => {
    const postData = {
        authorId,
        content,
        media,
        visibility: 'public',
        status,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    setDoc(doc(collection(db, "posts")), postData).catch((error) => {
        const permissionError = new FirestorePermissionError({
            path: `posts/new_post_id`,
            operation: 'create',
            requestResourceData: postData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};

export const toggleLikePost = async (postId: string, userId: string) => {
    const postRef = doc(db, 'posts', postId);
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
  
    await runTransaction(db, async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
  
      if (likeDoc.exists()) {
        // User has already liked the post, so unlike it.
        transaction.delete(likeRef);
        transaction.update(postRef, { likesCount: increment(-1) });
      } else {
        // User has not liked the post, so like it.
        transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
        transaction.update(postRef, { likesCount: increment(1) });
      }
    });
};

export const createComment = async (postId: string, authorId: string, content: string) => {
    const postRef = doc(db, 'posts', postId);
    const commentRef = doc(collection(db, 'posts', postId, 'comments'));
    
    const commentData = {
      postId,
      authorId,
      content,
      parentCommentId: null,
      createdAt: serverTimestamp(),
    };
    
    const batch = writeBatch(db);
    batch.set(commentRef, commentData);
    batch.update(postRef, { commentsCount: increment(1) });

    await batch.commit().catch(error => {
       const permissionError = new FirestorePermissionError({
            path: `posts/${postId}/comments/${commentRef.id}`,
            operation: 'create',
            requestResourceData: commentData
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};

export const sharePost = async (postId: string, userId: string) => {
    const postRef = doc(db, 'posts', postId);
    // In a real app, you might also create a "share" document
    // to track who shared what, but for now we'll just increment the count.
    await updateDoc(postRef, { sharesCount: increment(1) });
};
