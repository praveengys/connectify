'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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
    // In a real scenario, you'd fetch this from a financial API
    console.log(`Fetching stock price for ${input.ticker}`);
    if (input.ticker === 'GOOGL') return 175.0;
    if (input.ticker === 'AAPL') return 214.0;
    return Math.floor(Math.random() * 1000) + 100;
  }
);


export const searchDiscussions = ai.defineTool(
    {
        name: 'searchDiscussions',
        description: 'Searches for discussion threads based on a query.',
        inputSchema: z.object({
            query: z.string().describe('The search query for discussion titles.'),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            title: z.string(),
            path: z.string(),
        })),
    },
    async (input) => {
        const threadsRef = adminDb.collection('threads');
        const q = threadsRef
            .where('title', '>=', input.query)
            .where('title', '<=', input.query + '\uf8ff')
            .limit(5);

        const snapshot = await q.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            path: `/forum/threads/${doc.id}`,
        }));
    }
);

export const searchGroups = ai.defineTool(
    {
        name: 'searchGroups',
        description: 'Searches for chat groups based on a query.',
        inputSchema: z.object({
            query: z.string().describe('The search query for group names.'),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
            path: z.string(),
        })),
    },
    async (input) => {
        const groupsRef = adminDb.collection('groups');
        const q = groupsRef
            .where('name', '>=', input.query)
            .where('name', '<=', input.query + '\uf8ff')
            .limit(5);

        const snapshot = await q.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            path: `/chat/${doc.id}`,
        }));
    }
);
