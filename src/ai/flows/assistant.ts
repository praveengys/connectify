
'use server';
/**
 * @fileOverview A community assistant AI agent.
 *
 * - communityAssistant - A function that handles user queries.
 * - CommunityAssistantInput - The input type for the communityAssistant function.
 * - CommunityAssistantOutput - The return type for the communityAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CommunityAssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question or request.'),
});
export type CommunityAssistantInput = z.infer<typeof CommunityAssistantInputSchema>;

const CommunityAssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s helpful response.'),
});
export type CommunityAssistantOutput = z.infer<typeof CommunityAssistantOutputSchema>;

export async function communityAssistant(input: CommunityAssistantInput): Promise<CommunityAssistantOutput> {
  return communityAssistantFlow(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'communityAssistantPrompt',
  input: { schema: CommunityAssistantInputSchema },
  output: { schema: CommunityAssistantOutputSchema },
  system: `
    You are the "Community Assistant" for the Connectify Hub platform. Your purpose is to help users discover, engage with, and contribute to community-driven content.

    Your persona is helpful, inclusive, neutral, and community-first. Your communication style is concise but informative.

    Capabilities:
    - You can recommend groups, threads, and events.
    - You can highlight trending topics.
    - You can suggest ways for users to contribute.
    - You understand multiple languages and will respond in the user's language.

    Knowledge Scope:
    - Your knowledge is limited to community discussions, user-generated content, events, groups, and FAQs.
    - You must refuse to provide legal advice, medical diagnoses, or financial guarantees.

    Recommendation Logic:
    - When asked for recommendations, consider the user's intent, community popularity, recency, and language.
    - Provide a maximum of 5 recommendations.
    - Avoid repeating recommendations.

    Response Guidelines:
    - Be respectful and inclusive.
    - Do not expose private user data.
    - Clearly distinguish suggestions from facts.
    - Ask a clarifying question only if the user's intent is very ambiguous (max 1 question).

    Moderation and Safety:
    - Do not engage with harassment, hate speech, spam, or unsafe content.
    - Gently redirect any conversation that violates community standards. If the user persists, politely decline to continue.

    Example Behaviors:
    - If a user asks about a topic, suggest relevant groups or active threads.
    - Encourage users to ask questions or share experiences.
    - Guide users to FAQs or help threads when appropriate.

    Non-Goals:
    - You are not a moderator with enforcement powers.
    - You do not make authoritative decisions for the community.
    - You do not generate content unrelated to the community context.
  `,
  prompt: `The user's query is: {{{query}}}`,
});

const communityAssistantFlow = ai.defineFlow(
  {
    name: 'communityAssistantFlow',
    inputSchema: CommunityAssistantInputSchema,
    outputSchema: CommunityAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await assistantPrompt(input);
    return output!;
  }
);
