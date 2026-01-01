
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, User, Bot } from 'lucide-react';
import { communityAssistant } from '@/ai/flows/assistant';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const renderContentWithLinks = (content: string) => {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const text = match[1];
        const href = match[2];
        return (
          <Link key={index} href={href} className="text-primary underline hover:text-primary/80">
            {text}
          </Link>
        );
      }
      return part;
    });
};

export default function CommunityAssistantWidget() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const result = await communityAssistant({ query: input });
            const assistantMessage: Message = { role: 'assistant', content: result.response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error calling community assistant:", error);
            const errorMessage: Message = { role: 'assistant', content: "Sorry, I couldn't process your request right now." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[480px] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot /> Community Assistant
                </CardTitle>
                <CardDescription>I can help you find discussions, groups, and more. What are you looking for?</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'assistant' && (
                                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                                        <Bot size={20} />
                                    </Avatar>
                                )}
                                <div className={`rounded-lg px-4 py-2 text-sm max-w-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                    <p className="whitespace-pre-wrap">{renderContentWithLinks(message.content)}</p>
                                </div>
                                {message.role === 'user' && (
                                     <Avatar className="h-8 w-8">
                                        <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                                    <Bot size={20} />
                                </Avatar>
                                <div className="rounded-lg px-4 py-2 text-sm bg-secondary flex items-center">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter>
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={loading}
                    />
                    <Button type="submit" disabled={loading || !input.trim()}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
