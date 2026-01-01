
'use server';

import { ai } from '@/ai/genkit';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { z } from 'zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { SecurityRuleContext } from '@/firebase/errors';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query provided by the user.'),
});

const SearchOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the item found.'),
    path: z.string().describe('The URL path to access the item.'),
  })
);

export const searchGroupsTool = ai.defineTool(
  {
    name: 'searchGroups',
    description: 'Search for public chat groups by name.',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async ({ query: searchQuery }) => {
    console.log(`[Tool] Searching groups for: ${searchQuery}`);
    const { firestore } = initializeFirebase();
    const groupsRef = collection(firestore, 'groups');
    const q = query(
      groupsRef,
      where('type', '==', 'public'),
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff'),
      limit(5)
    );

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => ({
        name: doc.data().name,
        path: `/chat/${doc.id}`,
      }));
    } catch (serverError: any) {
        console.error("Error in searchGroupsTool", serverError.message);
        const permissionError = new FirestorePermissionError({
            path: groupsRef.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        // Return empty or throw, depending on how you want the AI to handle it.
        // For now, returning empty is safer for the user experience.
        return [];
    }
  }
);

export const searchMembersTool = ai.defineTool(
  {
    name: 'searchMembers',
    description: 'Search for community members by their display name.',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async ({ query: searchQuery }) => {
    console.log(`[Tool] Searching members for: ${searchQuery}`);
    const { firestore } = initializeFirebase();
    const usersRef = collection(firestore, 'users');
    const q = query(
      usersRef,
      where('profileVisibility', '==', 'public'),
      where('displayName', '>=', searchQuery),
      where('displayName', '<=', searchQuery + '\uf8ff'),
      limit(5)
    );

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => ({
        name: doc.data().displayName,
        path: `/members`, // No individual member page yet, so link to the main list
      }));
    } catch (serverError: any) {
      console.error("Error in searchMembersTool", serverError.message);
      const permissionError = new FirestorePermissionError({
          path: usersRef.path,
          operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return [];
    }
  }
);


export const searchDiscussionsTool = ai.defineTool(
  {
    name: 'searchDiscussions',
    description: 'Search for discussion threads by title.',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async ({ query: searchQuery }) => {
    console.log(`[Tool] Searching discussions for: ${searchQuery}`);
    const { firestore } = initializeFirebase();
    const threadsRef = collection(firestore, 'threads');
    const q = query(
      threadsRef,
      where('status', '==', 'published'),
      where('title', '>=', searchQuery),
      where('title', '<=', searchQuery + '\uf8ff'),
      limit(5)
    );
    
    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => ({
        name: doc.data().title,
        path: `/forum/threads/${doc.id}`,
      }));
    } catch (serverError: any) {
        console.error("Error in searchDiscussionsTool", serverError.message);
        const permissionError = new FirestorePermissionError({
            path: threadsRef.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return [];
    }
  }
);
