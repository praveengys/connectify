
'use client';

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import {
  type UserProfile,
  type Group,
  type ChatMessage,
  type Forum,
  type Thread,
  type Category,
  type Reply,
  type Post,
} from '../types';

// USER-related functions

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  avatarUrl: string | null
): Promise<UserProfile> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  const username = email.split('@')[0]; // Simple username generation

  const newUserProfile: UserProfile = {
    uid,
    username,
    displayName,
    email,
    avatarUrl,
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

  await setDoc(userRef, newUserProfile);
  return newUserProfile;
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      ...data,
      uid,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
      lastActiveAt: data.lastActiveAt?.toDate() ?? new Date(),
    } as UserProfile;
  }
  return null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
}

export async function toggleMuteUser(uid: string, isMuted: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { isMuted });
}

export async function toggleBanUser(uid: string, isBanned: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { isBanned });
}

export async function updateUserRole(uid: string, role: 'admin' | 'member'): Promise<void> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, { role });
}

// GROUP & CHAT related functions

export async function createChatGroup(name: string, type: 'public' | 'private', createdBy: string): Promise<Group> {
  const { firestore } = initializeFirebase();
  const groupsRef = collection(firestore, 'groups');
  
  const newGroupData = {
    name,
    type,
    createdBy,
    createdAt: serverTimestamp(),
    memberCount: 1,
    members: {
      [createdBy]: 'owner'
    }
  };

  const docRef = await addDoc(groupsRef, newGroupData);
  
  return { id: docRef.id, ...newGroupData, createdAt: new Date() } as Group;
}

export const joinChatGroup = async (groupId: string, userId: string) => {
  const { firestore } = initializeFirebase();
  const groupRef = doc(firestore, 'groups', groupId);

  await runTransaction(firestore, async (transaction) => {
    const groupDoc = await transaction.get(groupRef);
    if (!groupDoc.exists()) {
      throw new Error("Group does not exist!");
    }

    const groupData = groupDoc.data();
    if (groupData.members && groupData.members[userId]) {
      throw new Error("You are already a member of this group.");
    }
    
    transaction.update(groupRef, {
      [`members.${userId}`]: 'member',
      memberCount: increment(1)
    });
  });
};

export async function sendChatMessage(groupId: string, senderId: string, message: { type: 'text', text: string } | { type: 'image', imageUrl: string }) {
    const { firestore } = initializeFirebase();
    const messagesRef = collection(firestore, `groups/${groupId}/messages`);
    const senderProfile = await getUserProfile(senderId);

    const messageData: Partial<ChatMessage> = {
        senderId,
        createdAt: serverTimestamp(),
        status: 'visible',
        senderProfile: {
            displayName: senderProfile?.displayName ?? 'User',
            avatarUrl: senderProfile?.avatarUrl ?? null
        },
        ...message
    };

    await addDoc(messagesRef, messageData);
}

export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: deleteDoc,
        memberCount: increment(-1)
    });
}

export async function updateUserGroupRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const { firestore } = initializeFirebase();
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: role
    });
}


// FORUM & THREAD related functions

export async function createForum(name: string, description: string, createdBy: string): Promise<Forum> {
    const { firestore } = initializeFirebase();
    const forumsRef = collection(firestore, "forums");
    const newForumData = {
        name,
        description,
        createdBy,
        visibility: 'public' as const,
        status: 'active' as const,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(forumsRef, newForumData);
    return { id: docRef.id, ...newForumData, createdAt: new Date() } as Forum;
}

export async function getOrCreateCategory(name: string): Promise<Category> {
  const { firestore } = initializeFirebase();
  const categoriesRef = collection(firestore, 'categories');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const q = query(categoriesRef, where('slug', '==', slug));
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

type CreateThreadData = Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt' >;

export async function createThread(data: CreateThreadData): Promise<Thread> {
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

  // Also increment thread count in category
  const categoryRef = doc(firestore, 'categories', data.categoryId);
  await updateDoc(categoryRef, { threadCount: increment(1) });
  
  return { id: docRef.id, ...newThreadData, createdAt: new Date(), updatedAt: new Date() } as Thread;
}

export async function getThread(id: string): Promise<Thread | null> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', id);
    const docSnap = await getDoc(threadRef);
    if (docSnap.exists()) {
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

export async function createChatMessage(threadId: string, message: { senderId: string, text: string }) {
    const { firestore } = initializeFirebase();
    const messagesRef = collection(firestore, 'threads', threadId, 'chatMessages');
    const senderProfile = await getUserProfile(message.senderId);

    const messageData = {
        ...message,
        createdAt: serverTimestamp(),
        senderProfile: {
            displayName: senderProfile?.displayName ?? 'User',
            avatarUrl: senderProfile?.avatarUrl ?? null
        }
    };
    await addDoc(messagesRef, messageData);
}

export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const { firestore } = initializeFirebase();
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
    } as Reply));
}

type CreateReplyData = {
  threadId: string;
  authorId: string;
  body: string;
  parentReplyId: string | null;
};

export async function createReply(data: CreateReplyData) {
  const { firestore } = initializeFirebase();
  const threadRef = doc(firestore, 'threads', data.threadId);
  const repliesRef = collection(firestore, 'threads', data.threadId, 'replies');
  
  await runTransaction(firestore, async (transaction) => {
    const newReplyData: Omit<Reply, 'id'|'updatedAt'> = {
        threadId: data.threadId,
        authorId: data.authorId,
        body: data.body,
        parentReplyId: data.parentReplyId,
        status: 'published',
        createdAt: serverTimestamp() as Timestamp,
    };
    
    // Add the new reply document. We don't have the ref yet, but it's fine.
    transaction.set(doc(repliesRef), newReplyData);

    // Update the reply count and latest reply timestamp on the thread.
    transaction.update(threadRef, {
      replyCount: increment(1),
      latestReplyAt: serverTimestamp()
    });
  });
}

export async function toggleThreadLock(threadId: string, isLocked: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isLocked, updatedAt: serverTimestamp() });
}

export async function toggleThreadPin(threadId: string, isPinned: boolean): Promise<void> {
    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', threadId);
    await updateDoc(threadRef, { isPinned, updatedAt: serverTimestamp() });
}

// POSTS / FEED related functions

export async function createPost(authorId: string, content: string, status: 'active' | 'draft', media: string[] = []): Promise<Post> {
  const { firestore } = initializeFirebase();
  const postsRef = collection(firestore, "posts");
  
  const newPostData = {
    authorId,
    content,
    media,
    status,
    visibility: 'public' as const,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    repostsCount: 0,
    isRepost: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(postsRef, newPostData);
  return { id: docRef.id, ...newPostData, createdAt: new Date(), updatedAt: new Date() } as Post;
}

export async function toggleLikePost(postId: string, userId: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const postRef = doc(firestore, 'posts', postId);
  const likeRef = doc(firestore, 'posts', postId, 'likes', userId);

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


export async function createComment(postId: string, authorId: string, content: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const postRef = doc(firestore, 'posts', postId);
  const commentsRef = collection(firestore, 'posts', postId, 'comments');

  await runTransaction(firestore, async (transaction) => {
    // Add the new comment
    const newCommentData = {
      postId,
      authorId,
      content,
      parentCommentId: null,
      createdAt: serverTimestamp(),
    };
    transaction.set(doc(commentsRef), newCommentData);
    
    // Increment the commentsCount on the post
    transaction.update(postRef, { commentsCount: increment(1) });
  });
}

export async function sharePost(postId: string, userId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const postRef = doc(firestore, 'posts', postId);
    await updateDoc(postRef, { sharesCount: increment(1) });
}

export async function repostPost(originalPostId: string, repostingUserId: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const originalPostRef = doc(firestore, 'posts', originalPostId);
  const postsRef = collection(firestore, 'posts');

  await runTransaction(firestore, async (transaction) => {
    const originalPostSnap = await transaction.get(originalPostRef);
    if (!originalPostSnap.exists()) {
      throw new Error('Original post not found.');
    }
    const originalPostData = originalPostSnap.data() as Post;

    // Denormalize original author's profile for the repost
    let originalAuthorProfile: Pick<UserProfile, 'displayName' | 'avatarUrl' | 'username'> = {
        displayName: 'Unknown User',
        avatarUrl: null,
        username: 'unknown'
    };
    const userProfile = await getUserProfile(originalPostData.authorId);
    if (userProfile) {
        originalAuthorProfile = {
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl,
            username: userProfile.username,
        };
    }

    const newPostData = {
      ...originalPostData,
      authorId: repostingUserId, // The new author is the one reposting
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isRepost: true,
      originalPostId: originalPostId,
      originalAuthor: originalAuthorProfile,
      originalPostCreatedAt: originalPostData.createdAt,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      repostsCount: 0,
    };

    transaction.set(doc(postsRef), newPostData);
    transaction.update(originalPostRef, { repostsCount: increment(1) });
  });
}

    