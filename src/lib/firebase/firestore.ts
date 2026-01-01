

'use client';

import { doc, setDoc, getDoc, serverTimestamp, updateDoc, DocumentData, collection, getDocs, query, where, orderBy, addDoc, deleteDoc, runTransaction, Transaction, writeBatch, arrayUnion, FieldValue, increment } from 'firebase/firestore';
import type { UserProfile, Thread, Forum, Category, Reply, ChatMessage, Group, Member, Post } from '@/lib/types';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { SecurityRuleContext } from '@/firebase/errors';


// This function gets the firestore instance. It's defined once to avoid repetition.
function getFirestoreInstance() {
    return initializeFirebase().firestore;
}

// Create a new user profile document in Firestore
export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    console.error("createUserProfile called without a valid uid");
    return;
  }
  try {
    const firestore = getFirestoreInstance();
    
    // Roles should be managed on the backend via custom claims for security.
    // The client always creates a user with the 'member' role.
    const userRole = 'member';

    const userRef = doc(firestore, 'users', uid);
    const profileData = {
      username: `user_${uid.substring(0, 8)}`,
      role: userRole,
      profileVisibility: 'public',
      ...data,
      uid: uid, 
      isMuted: false,
      isBanned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDoc(userRef, profileData, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: profileData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
  } catch (error) {
    console.error("Error creating user profile: ", error);
  }
}

// Get a user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const firestore = getFirestoreInstance();
        const docRef = doc(firestore, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as DocumentData;
            // Convert Firestore Timestamps to JS Date objects
            return {
                ...data,
                uid: docSnap.id,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as UserProfile;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting user profile: ", error);
        return null;
    }
}

// Update a user profile document
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    if (!uid) {
        throw new Error('updateUserProfile called without a valid uid');
    }
    const firestore = getFirestoreInstance();
    const userRef = doc(firestore, 'users', uid);

    const updateData: Partial<UserProfile> & { updatedAt: FieldValue } = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    // Do not await, chain .catch for error handling
    updateDoc(userRef, updateData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}

// Admin function to update a user's role
export async function updateUserRole(uid: string, role: 'admin' | 'member') {
  if (!uid) throw new Error('UID is required.');
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  // Note: For custom claims to work, you also need a backend function
  // to set the claim on the user's auth token. This only updates the DB record.
  return updateDoc(userRef, { role, updatedAt: serverTimestamp() });
}

// Admin function to mute/unmute a user
export async function toggleMuteUser(uid: string, isMuted: boolean) {
  if (!uid) throw new Error('UID is required.');
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  return updateDoc(userRef, { isMuted: isMuted, updatedAt: serverTimestamp() });
}

// Admin function to ban/unban a user
export async function toggleBanUser(uid: string, isBanned: boolean) {
  if (!uid) throw new Error('UID is required.');
  const firestore = getFirestoreInstance();
  const userRef = doc(firestore, 'users', uid);
  return updateDoc(userRef, { isBanned: isBanned, updatedAt: serverTimestamp() });
}


// Get all public user profiles
export async function getPublicProfiles(limitCount = 20): Promise<UserProfile[]> {
  try {
    const firestore = getFirestoreInstance();
    const usersRef = collection(firestore, 'users');
    const q = query(
      usersRef,
      where('profileVisibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as UserProfile;
    });
  } catch (error) {
    console.error('Fetching public profiles:', error);
    return [];
  }
}

// Create a new discussion thread
export async function createThread(threadData: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'authorId' | 'isLocked'> & { authorId: string; forumId: string; title: string; body: string; }) {
    const firestore = getFirestoreInstance();
    const threadsCollection = collection(firestore, 'threads');

    const payload = {
        ...threadData,
        authorId: threadData.authorId, // REQUIRED by rules
        isLocked: false,
        replyCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    return addDoc(threadsCollection, payload).then(docRef => {
        return { id: docRef.id, ...payload, createdAt: new Date() } as Thread;
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: threadsCollection.path,
            operation: 'create',
            requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw to allow component to handle its loading state
    });
}

// Admin: Lock/Unlock a thread
export async function toggleThreadLock(threadId: string, isLocked: boolean) {
    const firestore = getFirestoreInstance();
    const threadRef = doc(firestore, 'threads', threadId);
    return updateDoc(threadRef, { isLocked });
}

// Admin: Pin/Unpin a thread
export async function toggleThreadPin(threadId: string, isPinned: boolean) {
    const firestore = getFirestoreInstance();
    const threadRef = doc(firestore, 'threads', threadId);
    return updateDoc(threadRef, { isPinned });
}

// Admin: Delete a thread and its replies
export async function deleteThread(threadId: string) {
    const firestore = getFirestoreInstance();
    const threadRef = doc(firestore, 'threads', threadId);
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    
    // Delete all replies in a batch
    const repliesSnapshot = await getDocs(repliesRef);
    const batch = writeBatch(firestore);
    repliesSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Delete the thread itself
    return deleteDoc(threadRef);
}


// Create a new forum
export async function createForum(name: string, description: string, createdBy: string) {
    const firestore = getFirestoreInstance();
    const forumsCollection = collection(firestore, 'forums');

    const newForumPayload = {
        name,
        description,
        createdBy: createdBy, // REQUIRED by rules
        createdAt: serverTimestamp(),
        visibility: 'public' as const,
        status: 'active' as const,
    };

    return addDoc(forumsCollection, newForumPayload).then(docRef => {
        return { 
            id: docRef.id,
            ...newForumPayload,
            createdAt: new Date(),
        } as Forum;
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: forumsCollection.path,
            operation: 'create',
            requestResourceData: newForumPayload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

// Get or create a category
export async function getOrCreateCategory(name: string): Promise<Category | null> {
  const normalizedName = name.trim();
  const slug = normalizedName.toLowerCase().replace(/\s+/g, '-');
  
  if (!normalizedName) return null;

  const firestore = getFirestoreInstance();
  const categoriesRef = collection(firestore, 'categories');
  const q = query(categoriesRef, where('slug', '==', slug));

  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Category exists, return it
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Category;
    } else {
      // Category does not exist, create it
      const newCategoryData = {
        name: normalizedName,
        slug: slug,
        description: `Discussions about ${normalizedName}`, // Default description
        threadCount: 0,
      };
      const docRef = await addDoc(categoriesRef, newCategoryData);
      return { id: docRef.id, ...newCategoryData } as Category;
    }
  } catch (error) {
    console.error("Error in getOrCreateCategory: ", error);
    throw error;
  }
}

// Get a single thread from Firestore
export async function getThread(threadId: string): Promise<Thread | null> {
    try {
        const firestore = getFirestoreInstance();
        const docRef = doc(firestore, 'threads', threadId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as Thread;
        }
        return null;
    } catch (error) {
        console.error('Error fetching thread:', error);
        return null;
    }
}

// Get a single reply from a thread's subcollection
export async function getReply(threadId: string, replyId: string): Promise<Reply | null> {
  const firestore = getFirestoreInstance();
  const replyRef = doc(firestore, "threads", threadId, "replies", replyId);
  const docSnap = await getDoc(replyRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Reply;
  }
  return null;
}

// Get all replies for a given thread
export async function getRepliesForThread(threadId: string): Promise<Reply[]> {
    const firestore = getFirestoreInstance();
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    } as Reply));
}

// Create a new reply in the subcollection
export async function createReply(replyData: { threadId: string; authorId: string; body: string; parentReplyId: string | null; }) {
    const firestore = getFirestoreInstance();
    const { threadId, authorId, body } = replyData;
    
    if (!threadId || !authorId) {
        throw new Error('Thread ID and Author ID are required.');
    }

    const threadRef = doc(firestore, 'threads', threadId);
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');

    const newReplyPayload = {
        threadId,
        body,
        authorId: authorId, // REQUIRED by rules
        parentReplyId: replyData.parentReplyId,
        status: 'published' as const,
        createdAt: serverTimestamp(),
    };

    return runTransaction(firestore, async (transaction) => {
        const threadDoc = await transaction.get(threadRef);
        if (!threadDoc.exists()) {
            throw new Error("Thread does not exist!");
        }

        const newReplyRef = doc(repliesRef); // Auto-generate ID
        transaction.set(newReplyRef, newReplyPayload);

        // Atomically update the reply count on the parent thread
        transaction.update(threadRef, {
            replyCount: (threadDoc.data().replyCount || 0) + 1,
            latestReplyAt: serverTimestamp()
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: repliesRef.path,
            operation: 'create',
            requestResourceData: newReplyPayload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw for component-level error handling
    });
}


// Create a new chat group
export async function createChatGroup(name: string, type: 'public' | 'private', createdBy: string) {
    const firestore = getFirestoreInstance();
    const newGroupRef = doc(collection(firestore, 'groups'));
    
    const newGroupPayload = {
        name,
        type,
        createdBy: createdBy,
        createdAt: serverTimestamp(),
        members: { [createdBy]: 'owner' },
        memberCount: 1,
        muted: {},
    };

    try {
        await setDoc(newGroupRef, newGroupPayload);
        return { 
            id: newGroupRef.id,
            ...newGroupPayload,
            createdAt: new Date(),
        } as Group;

    } catch (serverError) {
        console.error("Error creating chat group:", serverError);
        const permissionError = new FirestorePermissionError({
            path: newGroupRef.path,
            operation: 'create',
            requestResourceData: newGroupPayload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
}

// Join a chat group
export async function joinChatGroup(groupId: string, userId: string) {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);

    return runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) {
            throw new Error("Group does not exist!");
        }
        
        const groupData = groupDoc.data();
        if (groupData.members && groupData.members[userId]) {
            return; // User is already a member
        }

        const newMemberCount = (groupData.memberCount || 0) + 1;
        const newMembers = { ...groupData.members, [userId]: 'member' };

        transaction.update(groupRef, {
            members: newMembers,
            memberCount: newMemberCount,
        });
    }).catch(async (serverError) => {
        console.error("Error joining group:", serverError);
        const groupData = (await getDoc(groupRef)).data();
        const permissionError = new FirestorePermissionError({
            path: groupRef.path,
            operation: 'update',
            requestResourceData: { 
                members: { ...groupData?.members, [userId]: 'member' },
                memberCount: (groupData?.memberCount || 0) + 1
             },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}


// Send a chat message
export async function sendChatMessage(groupId: string, senderId: string, message: Partial<ChatMessage>) {
    const firestore = getFirestoreInstance();
    const messagesCollection = collection(firestore, 'groups', groupId, 'messages');
    
    const payload = {
        ...message,
        senderId: senderId, // REQUIRED by rules
        createdAt: serverTimestamp(),
        status: 'visible' as const,
    };
    
    addDoc(messagesCollection, payload).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: messagesCollection.path,
            operation: 'create',
            requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

// Create a new chat message in a thread's subcollection
export async function createChatMessage(threadId: string, messageData: { senderId: string; text: string; }) {
    const firestore = getFirestoreInstance();
    const chatMessagesRef = collection(firestore, 'threads', threadId, 'chatMessages');

    const payload = {
        ...messageData,
        senderId: messageData.senderId, // Explicitly ensure senderId is in the payload
        createdAt: serverTimestamp(),
    };

    return addDoc(chatMessagesRef, payload).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: chatMessagesRef.path,
            operation: 'create',
            requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}


// Delete a group and all its subcollections (messages, typing indicators)
export async function deleteGroup(groupId: string) {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);

    const messagesRef = collection(firestore, 'groups', groupId, 'messages');
    const messagesSnap = await getDocs(messagesRef);
    const batch = writeBatch(firestore);
    messagesSnap.forEach(doc => batch.delete(doc.ref));
    
    const typingRef = collection(firestore, 'groups', groupId, 'typing');
    const typingSnap = await getDocs(typingRef);
    typingSnap.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
    await deleteDoc(groupRef);
}

// Admin: Mute/unmute a user in a group
export async function toggleUserMuteInGroup(groupId: string, userId: string, mute: boolean) {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);
    
    if (mute) {
        // Mute user until a far-future date
        const muteUntil = new Date('2200-01-01');
        return updateDoc(groupRef, {
            [`muted.${userId}`]: muteUntil
        });
    } else {
        // Unmute by removing the field
        const groupData = (await getDoc(groupRef)).data();
        if (groupData && groupData.muted) {
            const newMutedMap = { ...groupData.muted };
            delete newMutedMap[userId];
            return updateDoc(groupRef, { muted: newMutedMap });
        }
    }
}


// Admin: Remove a member from a group
export async function removeUserFromGroup(groupId: string, userId: string) {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);
    return runTransaction(firestore, async (transaction) => {
        const groupDoc = await transaction.get(groupRef);
        if (!groupDoc.exists()) throw new Error("Group not found");
        
        const data = groupDoc.data();
        const newMembers = { ...data.members };
        delete newMembers[userId];
        
        const newMemberCount = Math.max(0, (data.memberCount || 1) - 1);
        
        transaction.update(groupRef, { members: newMembers, memberCount: newMemberCount });
    });
}

// Admin: Update a member's role in a group
export async function updateUserGroupRole(groupId: string, userId: string, role: 'admin' | 'member') {
    const firestore = getFirestoreInstance();
    const groupRef = doc(firestore, 'groups', groupId);
    return updateDoc(groupRef, {
        [`members.${userId}`]: role
    });
}

// Create a new post in the feed
export async function createPost(authorId: string, content: string, status: 'active' | 'draft' = 'active', media?: string[]) {
    const firestore = getFirestoreInstance();
    const postsCollection = collection(firestore, 'posts');
    
    const payload = {
        authorId,
        content,
        media: media || [],
        visibility: 'public' as const,
        status,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    return addDoc(postsCollection, payload).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: postsCollection.path,
            operation: 'create',
            requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

// Toggle like on a post
export async function toggleLikePost(postId: string, userId: string) {
    const firestore = getFirestoreInstance();
    const postRef = doc(firestore, 'posts', postId);
    const likeRef = doc(firestore, 'posts', postId, 'likes', userId);

    return runTransaction(firestore, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        const postDoc = await transaction.get(postRef);

        if (!postDoc.exists()) {
            throw new Error("Post not found");
        }

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
