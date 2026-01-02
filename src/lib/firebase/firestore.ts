
'use client';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  runTransaction,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { UserProfile, User, Forum, Thread, Reply, Post, PostComment } from '../types';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase
const { firestore } = initializeFirebase();

/**
 * Creates or updates a user profile in Firestore.
 * @param user The user object from Firebase Auth.
 * @param additionalData Additional data to merge into the user's profile.
 */
export const createUserProfile = async (
  user: User,
  additionalData: Partial<UserProfile> = {}
): Promise<void> => {
  if (!user) return;

  const userRef = doc(firestore, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { displayName, email, photoURL } = user;
    const username = email ? email.split('@')[0] : `user_${Date.now()}`;
    const newUserProfile: UserProfile = {
      uid: user.uid,
      displayName: additionalData.displayName || displayName || 'Anonymous',
      username: additionalData.username || username,
      email: email || '',
      avatarUrl: additionalData.avatarUrl || photoURL || null,
      bio: '',
      interests: [],
      skills: [],
      languages: [],
      location: '',
      currentlyExploring: '',
      role: 'member',
      profileVisibility: 'public',
      emailVerified: user.emailVerified,
      profileScore: 0,
      postCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      ...additionalData,
    };
    await setDoc(userRef, newUserProfile, { merge: true });
  } else {
    // If user profile exists, update last active time and merge any new data
    await setDoc(userRef, { ...additionalData, lastActiveAt: new Date() }, { merge: true });
  }
};


export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  const userRef = doc(firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      ...data,
      uid: snapshot.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    } as UserProfile;
  } else {
    return null;
  }
};

/**
 * Updates a user's profile data in Firestore.
 * @param uid The user's ID.
 * @param data The partial user profile data to update.
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(firestore, 'users', uid);
  await setDoc(userRef, { ...data, updatedAt: new Date() }, { merge: true });
};

export const updateUserRole = async (uid: string, role: 'member' | 'admin'): Promise<void> => {
    const userRef = doc(firestore, 'users', uid);
    await setDoc(userRef, { role, updatedAt: new Date() }, { merge: true });
}

export const toggleMuteUser = async (uid: string, isMuted: boolean): Promise<void> => {
    const userRef = doc(firestore, 'users', uid);
    await setDoc(userRef, { isMuted, updatedAt: new Date() }, { merge: true });
}

export const toggleBanUser = async (uid: string, isBanned: boolean): Promise<void> => {
    const userRef = doc(firestore, 'users', uid);
    await setDoc(userRef, { isBanned, updatedAt: new Date() }, { merge: true });
};


export const createForum = async (name: string, description: string, createdBy: string): Promise<Forum> => {
    const newForumRef = await addDoc(collection(firestore, 'forums'), {
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
        createdAt: new Date(), // Return current date for immediate use
    };
};

export const getOrCreateCategory = async (name: string): Promise<Category | null> => {
    const categoriesRef = collection(firestore, 'categories');
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const q = query(categoriesRef, where('slug', '==', slug));

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Category;
    } else {
        const newCategoryRef = await addDoc(categoriesRef, {
            name: name,
            slug: slug,
            description: `Discussions related to ${name}`,
            threadCount: 0
        });
        return {
            id: newCategoryRef.id,
            name: name,
            slug: slug,
            description: `Discussions related to ${name}`,
            threadCount: 0
        };
    }
};

export const createThread = async (threadData: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'latestReplyAt'>): Promise<Thread> => {
    const threadWithTimestamp = {
        ...threadData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        replyCount: 0,
        latestReplyAt: null
    };

    const newThreadRef = await addDoc(collection(firestore, 'threads'), threadWithTimestamp);
    
    return {
        ...threadData,
        id: newThreadRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        replyCount: 0,
        latestReplyAt: null
    };
};

export const getThread = async (threadId: string): Promise<Thread | null> => {
    const threadRef = doc(firestore, 'threads', threadId);
    const snapshot = await getDoc(threadRef);

    if (snapshot.exists()) {
        const data = snapshot.data();
        return {
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
        } as Thread;
    }
    return null;
}

export const getRepliesForThread = async (threadId: string): Promise<Reply[]> => {
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    } as Reply));
};

export const createReply = async (replyData: Pick<Reply, 'threadId' | 'authorId' | 'body' | 'parentReplyId'>) => {
    const { threadId, ...rest } = replyData;
    const replyWithTimestamp = {
        ...rest,
        createdAt: serverTimestamp(),
        status: 'published' as const
    };
    
    const threadRef = doc(firestore, 'threads', threadId);
    const newReplyRef = doc(collection(firestore, 'threads', threadId, 'replies'));

    await runTransaction(firestore, async (transaction) => {
        const threadDoc = await transaction.get(threadRef);
        if (!threadDoc.exists()) {
            throw new Error("Thread does not exist!");
        }

        const newReplyCount = (threadDoc.data().replyCount || 0) + 1;
        transaction.update(threadRef, { 
            replyCount: newReplyCount,
            latestReplyAt: serverTimestamp()
        });

        transaction.set(newReplyRef, replyWithTimestamp);
    });
};

export const createChatMessage = async (
  threadId: string,
  messageData: Omit<ChatMessage, 'id' | 'createdAt' | 'status' | 'senderProfile'>
): Promise<void> => {
  const messageWithTimestamp = {
    ...messageData,
    createdAt: serverTimestamp(),
    status: 'visible' as const
  };

  const messagesRef = collection(firestore, 'threads', threadId, 'chatMessages');
  await addDoc(messagesRef, messageWithTimestamp);
};

export const createChatGroup = async (name: string, type: 'public' | 'private', ownerId: string): Promise<void> => {
    const groupRef = doc(collection(firestore, 'groups'));

    const newGroup = {
        name,
        type,
        createdBy: ownerId,
        createdAt: serverTimestamp(),
        memberCount: 1,
        members: {
            [ownerId]: 'owner'
        }
    };
    await setDoc(groupRef, newGroup);
};

export const joinChatGroup = async (groupId: string, userId: string): Promise<void> => {
    const groupRef = doc(firestore, 'groups', groupId);
    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist!");
        }
        
        const data = groupDoc.data();
        if (data.members[userId]) {
            // Already a member
            return;
        }

        const newMemberCount = (data.memberCount || 0) + 1;
        const newMembers = { ...data.members, [userId]: 'member' };

        transaction.update(groupRef, {
            memberCount: newMemberCount,
            members: newMembers,
        });
    });
};

export const removeUserFromGroup = async (groupId: string, userId: string): Promise<void> => {
    const groupRef = doc(firestore, 'groups', groupId);
    await runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) throw new Error("Group not found.");

        const data = groupDoc.data();
        const { [`members.${userId}`]: deleted, ...restMembers } = data.members;

        if (!data.members[userId]) return; // Not a member

        const newMemberCount = Math.max(0, (data.memberCount || 1) - 1);
        
        transaction.update(groupRef, {
            members: { ...restMembers },
            memberCount: newMemberCount
        });
    });
};

export const updateUserGroupRole = async (groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> => {
    const groupRef = doc(firestore, 'groups', groupId);
    await updateDoc(groupRef, {
        [`members.${userId}`]: role
    });
};


export const deleteGroup = async (groupId: string): Promise<void> => {
    const groupRef = doc(firestore, 'groups', groupId);
    // This is a simple delete. A more robust solution would handle subcollections (messages, etc.)
    // via a Cloud Function to ensure atomicity and completeness.
    await deleteDoc(groupRef);
}

export const toggleThreadLock = async (threadId: string, lock: boolean): Promise<void> => {
    const threadRef = doc(firestore, 'threads', threadId);
    await setDoc(threadRef, { isLocked: lock, updatedAt: serverTimestamp() }, { merge: true });
};

export const toggleThreadPin = async (threadId: string, pin: boolean): Promise<void> => {
    const threadRef = doc(firestore, 'threads', threadId);
    await setDoc(threadRef, { isPinned: pin, updatedAt: serverTimestamp() }, { merge: true });
};

export const deleteThread = async (threadId: string): Promise<void> => {
    // This is a simplified deletion. In a real-world app, you might want to
    // also delete all replies and chat messages using a batched write or a Cloud Function.
    const threadRef = doc(firestore, 'threads', threadId);
    await deleteDoc(threadRef);
}

export const sendChatMessage = async (
    groupId: string,
    senderId: string,
    content: { type: 'text', text: string } | { type: 'image', imageUrl: string }
): Promise<void> => {
    // 1. Get sender's profile for denormalization
    const userProfile = await getUserProfile(senderId);
    const senderProfile = {
        displayName: userProfile?.displayName || 'User',
        avatarUrl: userProfile?.avatarUrl || null,
    };

    // 2. Prepare message data
    const messageData = {
        senderId,
        ...content,
        createdAt: serverTimestamp(),
        status: 'visible' as const,
        senderProfile, // Include denormalized data
    };

    // 3. Add the new message to the subcollection
    const messageRef = collection(firestore, 'groups', groupId, 'messages');
    await addDoc(messageRef, messageData);
};

export const createPost = async (
  authorId: string,
  content: string,
  status: 'active' | 'draft',
  media: string[] = []
): Promise<void> => {
    const postData = {
        authorId,
        content,
        media,
        status,
        visibility: 'public', // Default to public for now
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await addDoc(collection(firestore, 'posts'), postData);
};

export const toggleLikePost = async (postId: string, userId: string): Promise<void> => {
    const postRef = doc(firestore, 'posts', postId);
    const likeRef = doc(firestore, 'posts', postId, 'likes', userId);

    await runTransaction(firestore, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        const likeDoc = await transaction.get(likeRef);

        if (!postDoc.exists()) {
            throw new Error("Post does not exist.");
        }

        const currentLikes = postDoc.data().likesCount || 0;

        if (likeDoc.exists()) {
            // User has already liked the post, so unlike it.
            transaction.delete(likeRef);
            transaction.update(postRef, { likesCount: Math.max(0, currentLikes - 1) });
        } else {
            // User has not liked the post, so like it.
            transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
            transaction.update(postRef, { likesCount: currentLikes + 1 });
        }
    });
};

export const createComment = async (
    postId: string,
    authorId: string,
    content: string,
    parentCommentId: string | null = null,
): Promise<void> => {
    const postRef = doc(firestore, 'posts', postId);
    const commentRef = doc(collection(firestore, 'posts', postId, 'comments'));

    const commentData: Omit<PostComment, 'id' | 'createdAt'> = {
        postId,
        authorId,
        content,
        parentCommentId,
        createdAt: serverTimestamp(),
    };

    await runTransaction(firestore, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
            throw new Error("Post does not exist!");
        }

        const newCommentCount = (postDoc.data().commentsCount || 0) + 1;
        transaction.update(postRef, { commentsCount: newCommentCount });
        transaction.set(commentRef, commentData);
    });
};
