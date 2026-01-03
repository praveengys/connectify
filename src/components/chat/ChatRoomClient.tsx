'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Loader2, ServerCrash, Smile, Image as ImageIcon, Download, Send, Paperclip, Mic, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { initializeFirebase } from '@/firebase';
import type { ChatMessage, Group, TypingIndicator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { uploadPhoto } from '@/lib/actions';
import { sendChatMessage } from '@/lib/firebase/client-actions';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function ChatRoomClient({ group }: { group: Group }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!user) return;
    const { firestore } = initializeFirebase();
    const typingRef = doc(firestore, 'groups', group.id, 'typing', user.uid);
    const displayName = user.displayName || 'Anonymous';
    await setDoc(typingRef, {
      isTyping,
      updatedAt: serverTimestamp(),
      displayName: displayName
    });
  }, [user, group.id]);

  useEffect(() => {
    if (authLoading || !user) return;
    const { firestore } = initializeFirebase();

    // Messages listener
    const messagesRef = collection(firestore, 'groups', group.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
      } as ChatMessage));
      setMessages(newMessages);
      setLoading(false);
    }, (err) => {
      console.error("Messages snapshot error:", err);
      setError("Failed to load messages. You may not have permission to view this chat.");
      setLoading(false);
    });

    // Typing indicators listener
    const typingRef = collection(firestore, 'groups', group.id, 'typing');
    const typingQuery = query(typingRef);
    const unsubscribeTyping = onSnapshot(typingQuery, (snapshot) => {
        const now = Date.now();
        const indicators = snapshot.docs.map(doc => ({
            ...doc.data(),
            user: { uid: doc.id, displayName: doc.data().displayName },
            updatedAt: doc.data().updatedAt?.toDate() ?? new Date(),
        })).filter(indicator => indicator.isTyping && (now - (indicator.updatedAt as Date).getTime()) < 5000 && indicator.user.uid !== user.uid);
        setTypingUsers(indicators as TypingIndicator[]);
    });


    // Cleanup
    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      updateTypingStatus(false);
    };
  }, [group.id, user, authLoading, updateTypingStatus]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleTyping = () => {
    if (!user) return;
    updateTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    await sendChatMessage(group.id, user.uid, { type: 'text', text: text.trim() });
    setText('');
    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };
  
  const handleImageUpload = async (file: File) => {
    if (!file || !user) return;
    toast({ title: 'Uploading image...', description: 'Please wait.' });
    try {
        const formData = new FormData();
        formData.append('photo', file);
        const result: any = await uploadPhoto(formData);
        
        if (!result?.secure_url) throw new Error('Image upload failed.');
        
        await sendChatMessage(group.id, user.uid, { type: 'image', imageUrl: result.secure_url });
        toast({ title: 'Success', description: 'Image sent.' });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };


  const handleReaction = async (messageId: string, emoji: string) => {
    // Reaction logic would be implemented here
    toast({ title: 'Reaction added (UI only)', description: `You reacted with ${emoji}` });
  };
  
  const createDownloadUrl = (url: string): string => {
    if (url.includes('res.cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
      }
    }
    return url;
  }


  if (loading) {
    return <div className="flex-grow flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="flex-grow flex flex-col items-center justify-center text-destructive bg-destructive/10"><ServerCrash className="h-8 w-8 mb-2" /><p className="font-semibold">{error}</p></div>;
  }

  return (
    <div className="flex-grow flex flex-col h-full bg-background">
       <div className="p-4 border-b flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        </Avatar>
        <div>
            <h2 className="font-semibold text-lg">{group.name}</h2>
            <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
        </div>
      </div>
      <ScrollArea className="flex-grow p-4" ref={scrollRef}>
        <div className="space-y-6">
        {messages.map((msg, index) => {
            const isCurrentUser = msg.senderId === user?.uid;
            const sender = msg.senderProfile || { displayName: 'User', avatarUrl: null };
            return (
                <div key={msg.id} className={cn("flex items-end gap-3 w-full", isCurrentUser ? "justify-end" : "justify-start")}>
                    {!isCurrentUser && <Avatar className="h-8 w-8 self-start"><AvatarImage src={sender.avatarUrl || undefined} /><AvatarFallback>{sender.displayName.charAt(0)}</AvatarFallback></Avatar>}
                    <div className={cn("flex flex-col max-w-sm", isCurrentUser ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-4 py-2 rounded-lg relative group text-sm",
                           isCurrentUser 
                             ? "bg-primary-chat text-primary-chat-foreground rounded-br-none" 
                             : "bg-secondary text-secondary-foreground rounded-bl-none"
                           )}>
                            {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.text}</p>}
                            {msg.type === 'image' && msg.imageUrl && (
                                <div className="relative">
                                    <Image src={msg.imageUrl} alt="Shared image" width={200} height={200} className="rounded-md object-cover" />
                                    <a
                                        href={createDownloadUrl(msg.imageUrl)}
                                        download
                                        className="absolute bottom-1 right-1"
                                    >
                                        <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download size={14} />
                                        </Button>
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 px-1">
                          <span>{format(new Date(msg.createdAt), 'p')}</span>
                          {!isCurrentUser && <span className="font-semibold ml-2">{sender.displayName}</span>}
                        </div>
                    </div>
                </div>
            )
        })}
        </div>
      </ScrollArea>
       <div className="h-6 px-4 text-xs text-muted-foreground italic">
            {typingUsers.length > 0 && `${typingUsers.map(u => u.user.displayName).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`}
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
                value={text}
                onChange={e => { setText(e.target.value); handleTyping(); }}
                placeholder="Write Something"
                autoComplete="off"
                disabled={authLoading}
                className="bg-secondary/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="button" size="icon" variant="ghost">
                <Mic size={20} />
            </Button>
             <label htmlFor="image-upload" className="cursor-pointer">
                <Button type="button" size="icon" variant="ghost" asChild>
                    <div><Paperclip size={20} /></div>
                </Button>
            </label>
            <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={e => e.target.files && handleImageUpload(e.target.files[0])} />
            <Button type="submit" size="icon" disabled={!text.trim()}>
                <Send size={20}/>
            </Button>
        </form>
      </div>
    </div>
  );
}
