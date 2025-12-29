
'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Loader2, ServerCrash } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { initializeFirebase } from '@/firebase';
import type { ChatMessage, Thread, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import ChatMessageItem from './ChatMessage';
import ChatInput from './ChatInput';
import { createChatMessage } from '@/lib/firebase/firestore';

type ChatRoomProps = {
  thread: Thread;
};

export default function ChatRoom({ thread }: ChatRoomProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setError("You must be logged in to view the live chat.");
      return;
    }
    
    const { firestore } = initializeFirebase();
    const messagesRef = collection(firestore, 'threads', thread.id, 'chatMessages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newMessages = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as any)?.toDate() ?? new Date(),
          } as ChatMessage))
          .reverse(); // Reverse to show oldest first
        
        setMessages(newMessages);
        setLoading(false);
        setError(null);
      }, 
      (err) => {
        console.error("Chat snapshot error:", err);
        toast({
          title: 'Real-time connection failed',
          description: 'Could not listen for new chat messages.',
          variant: 'destructive',
        });
        setError('Failed to load chat messages.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [thread.id, user, authLoading, toast]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }
     if (thread.isLocked) {
      toast({ title: "This chat is locked.", variant: "destructive" });
      return;
    }

    const messageData = {
      senderId: user.uid,
      text,
    };

    try {
      await createChatMessage(thread.id, messageData);
    } catch (e: any) {
      toast({
        title: "Error sending message",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 border rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border rounded-lg text-destructive bg-destructive/10 p-4">
        <ServerCrash className="h-8 w-8 mb-2" />
        <p className="font-semibold">Error Loading Chat</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col h-96">
      <div ref={scrollRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => <ChatMessageItem key={msg.id} message={msg} currentUser={user as UserProfile} />)
        )}
      </div>
      <div className="p-4 border-t bg-background/80">
        <ChatInput onSendMessage={handleSendMessage} disabled={thread.isLocked} />
      </div>
    </div>
  );
}
