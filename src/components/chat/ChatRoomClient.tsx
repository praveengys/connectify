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
  serverTimestamp,
  startAfter,
  getDocs,
  where,
} from 'firebase/firestore';
import { Loader2, ServerCrash, Smile, Image as ImageIcon, ThumbsUp, Heart, Angry, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { initializeFirebase } from '@/firebase';
import type { ChatMessage, Group, TypingIndicator, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { uploadPhoto } from '@/lib/actions';
import { sendChatMessage, updateUserProfile } from '@/lib/firebase/firestore';
import Image from 'next/image';

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
    await setDoc(typingRef, {
      isTyping,
      updatedAt: serverTimestamp()
    });
  }, [user, group.id]);

  useEffect(() => {
    if (authLoading || !user) return;
    const { firestore } = initializeFirebase();

    // Messages listener
    const messagesRef = collection(firestore, 'groups', group.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(30));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
      } as ChatMessage)).reverse();
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

  const getReactionIcon = (emoji: string) => {
    switch (emoji) {
        case '👍': return <ThumbsUp size={16} className="text-blue-500" />;
        case '❤️': return <Heart size={16} className="text-red-500" fill="currentColor" />;
        case '😂': return <Smile size={16} className="text-yellow-500" />;
        case '😮': return <Smile size={16} className="text-yellow-400" />;
        case '😢': return <Angry size={16} className="text-orange-500" />;
        case '🔥': return <MessageSquare size={16} className="text-orange-600" />; // Placeholder, no fire icon in lucide
        default: return null;
    }
  }


  if (loading) {
    return <div className="flex-grow flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="flex-grow flex flex-col items-center justify-center text-destructive bg-destructive/10"><ServerCrash className="h-8 w-8 mb-2" /><p className="font-semibold">{error}</p></div>;
  }

  return (
    <div className="flex-grow flex flex-col">
      <div ref={scrollRef} className="flex-grow p-4 space-y-6 overflow-y-auto">
        {messages.map((msg, index) => {
            const isCurrentUser = msg.senderId === user?.uid;
            const sender = msg.senderProfile || { displayName: 'User', avatarUrl: null };
            return (
                <div key={msg.id} className={cn("flex items-end gap-3", isCurrentUser ? "justify-end" : "justify-start")}>
                    {!isCurrentUser && <Avatar className="h-8 w-8"><AvatarImage src={sender.avatarUrl || undefined} /><AvatarFallback>{sender.displayName.charAt(0)}</AvatarFallback></Avatar>}
                    <div className={cn("flex flex-col max-w-xs md:max-w-md", isCurrentUser ? "items-end" : "items-start")}>
                        <div className={cn("px-4 py-2 rounded-lg relative group", isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none")}>
                            {!isCurrentUser && <p className="text-xs font-bold mb-1">{sender.displayName}</p>}
                            {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                            {msg.type === 'image' && msg.imageUrl && <Image src={msg.imageUrl} alt="Shared image" width={200} height={200} className="rounded-md object-cover" />}
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button size="icon" variant="ghost" className="absolute -top-4 -right-4 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><Smile size={14} /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-1">
                                    <div className="flex gap-1">
                                        {EMOJI_REACTIONS.map(emoji => <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReaction(msg.id, emoji)}>{emoji}</Button>)}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 px-1">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </div>
                    </div>
                    {isCurrentUser && <Avatar className="h-8 w-8"><AvatarImage src={user?.avatarUrl || undefined} /><AvatarFallback>{user?.displayName.charAt(0)}</AvatarFallback></Avatar>}
                </div>
            )
        })}
      </div>
       <div className="h-6 px-4 text-xs text-muted-foreground italic">
            {typingUsers.length > 0 && `${typingUsers.map(u => u.user.displayName).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`}
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
                value={text}
                onChange={e => { setText(e.target.value); handleTyping(); }}
                placeholder="Type a message..."
                autoComplete="off"
                disabled={authLoading}
            />
             <label htmlFor="image-upload" className="cursor-pointer">
                <Button variant="ghost" size="icon" asChild>
                    <div><ImageIcon /></div>
                </Button>
            </label>
            <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={e => e.target.files && handleImageUpload(e.target.files[0])} />
            <Button type="submit" disabled={!text.trim()}>Send</Button>
        </form>
      </div>
    </div>
  );
}
