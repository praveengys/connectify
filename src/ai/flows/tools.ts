'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { adminDb } from '@/firebase/server';

// Example Tool: Get Stock Price
export const getStockPrice = ai.defineTool(
  {
    name: 'getStockPrice',
    description: 'Returns the current market value of a stock.',
    inputSchema: z.object({
      ticker: z.string().describe('The ticker symbol of the stock.'),
    }),
    outputSchema: z.number(),
  },
  async (input) => {
    // This is a mock. In a real app, you'd call a financial API.
    return Math.random() * 1000;
  }
);


export const searchDiscussions = ai.defineTool(
  {
    name: 'searchDiscussions',
    description: 'Search for discussions (threads) in the community forum.',
    inputSchema: z.object({
      searchTerm: z.string().describe('The term to search for in discussion titles.'),
    }),
    outputSchema: z.array(z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
    })),
  },
  async (input) => {
    if (!adminDb) {
      throw new Error("Firestore not initialized for search.");
    }
    const threadsRef = collection(adminDb, 'threads');
    // Firestore does not support full-text search, this is a basic prefix match.
    // For a real app, use a dedicated search service like Algolia.
    const q = query(
        threadsRef, 
        where('title', '>=', input.searchTerm),
        where('title', '<=', input.searchTerm + '\uf8ff'),
        orderBy('title'),
        limit(5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        url: `/forum/threads/${doc.id}`,
    }));
  }
);


export const searchGroups = ai.defineTool(
  {
    name: 'searchGroups',
    description: 'Search for chat groups in the community.',
    inputSchema: z.object({
      searchTerm: z.string().describe('The term to search for in group names.'),
    }),
    outputSchema: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
    })),
  },
  async (input) => {
     if (!adminDb) {
      throw new Error("Firestore not initialized for search.");
    }
    const groupsRef = collection(adminDb, 'groups');
    const q = query(
        groupsRef, 
        where('name', '>=', input.searchTerm),
        where('name', '<=', input.searchTerm + '\uf8ff'),
        orderBy('name'),
        limit(5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        url: `/chat/${doc.id}`,
    }));
  }
);
