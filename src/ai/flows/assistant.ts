'use server';

import { ai } from '@/ai/genkit';
import { getStockPrice, searchDiscussions, searchGroups } from './tools';
import { z } from 'zod';

const AssistantRequestSchema = z.object({
    query: z.string(),
});

const AssistantResponseSchema = z.object({
    response: z.string(),
});

export async function communityAssistant(input: z.infer<typeof AssistantRequestSchema>): Promise<z.infer<typeof AssistantResponseSchema>> {
  const llmResponse = await ai.generate({
    model: 'googleai/gemini-1.5-flash-preview',
    tools: [searchDiscussions, searchGroups],
    prompt: `You are a helpful community assistant for the AITSP platform.
    Your goal is to help users find what they are looking for.
    You can search for discussions and groups.
    If the user asks for something you can't do, politely decline.
    User's question: ${input.query}`,
  });

  const toolResponse = llmResponse.toolRequest;
  if(toolResponse) {
    const toolResult = await toolResponse.execute();
    
    const secondLlmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash-preview',
        prompt: `The user asked: "${input.query}". The following information was found: ${toolResult}. Based on this, formulate a helpful and concise response. If relevant, include markdown links to the content you found.`,
    });

    return { response: secondLlmResponse.text };
  }

  return { response: llmResponse.text };
}
