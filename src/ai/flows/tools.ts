'use server';

import { ai } from '@/ai/genkit';
import { adminFirestore } from '@/firebase/server';
import { z } from 'zod';

export const searchDiscussions = ai.defineTool(
  {
    name: 'searchDiscussions',
    description: 'Search for discussion threads based on a query.',
    inputSchema: z.object({
      query: z.string().describe('The search term to find discussions.'),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
      })
    ),
  },
  async (input) => {
    if (!adminFirestore) {
      console.log('Firestore admin not initialized, skipping discussion search.');
      return [];
    }
    const snapshot = await adminFirestore
      .collection('threads')
      .where('title', '>=', input.query)
      .where('title', '<=', input.query + '\uf8ff')
      .limit(5)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title,
      url: `/forum/threads/${doc.id}`,
    }));
  }
);

export const searchGroups = ai.defineTool(
  {
    name: 'searchGroups',
    description: 'Search for community groups based on a query.',
    inputSchema: z.object({
      query: z.string().describe('The search term to find groups.'),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
      })
    ),
  },
  async (input) => {
    if (!adminFirestore) {
        console.log('Firestore admin not initialized, skipping group search.');
        return [];
    }
    const snapshot = await adminFirestore
      .collection('groups')
      .where('name', '>=', input.query)
      .where('name', '<=', input.query + '\uf8ff')
      .limit(5)
      .get();
    
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        url: `/chat/${doc.id}`,
    }));
  }
);
