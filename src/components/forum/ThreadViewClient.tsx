'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';

import { initializeFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Reply, Thread, UserProfile } from '@/lib/types';
import { createReply, getUserProfile } from '@/lib/firebase/firestore';
import { Loader2, MessageSquare, CornerDownRight, X } from 'lucide-react';

type ThreadViewClientProps = {
  initialThread: Thread;
  initialReplies: Reply[];
  initialAuthors: Record<string, UserProfile>;
};

const replySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty.'),
});

export default function ThreadViewClient({ initialThread, initialReplies, initialAuthors }: ThreadViewClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<Thread>(initialThread);
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>(initialAuthors);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<{ authorId: string; displayName: string } | null>(null);
  const replyFormBodyRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    const { firestore } = initializeFirebase();
    const repliesRef = collection(firestore, 'threads', thread.id, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const newReplies: Reply[] = [];
      const authorIdsToFetch = new Set<string>();

      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'published') return; // Skip non-published replies

        const reply = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() ?? new Date(),
        } as Reply;
        newReplies.push(reply);

        if (!authors[reply.authorId]) {
          authorIdsToFetch.add(reply.authorId);
        }
        if (reply.replyToAuthorId && !authors[reply.replyToAuthorId]) {
          authorIdsToFetch.add(reply.replyToAuthorId);
        }
      });

      if (authorIdsToFetch.size > 0) {
        const fetchedAuthors = await Promise.all(
          Array.from(authorIdsToFetch).map(id => getUserProfile(id))
        );
        setAuthors(prev => {
          const newAuthors = { ...prev };
          fetchedAuthors.forEach(author => {
            if (author) newAuthors[author.uid] = author;
          });
          return newAuthors;
        });
      }
      
      setReplies(newReplies);
    });

    return () => unsubscribe();
  }, [thread.id, authors]);

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: '' },
  });

  const onSubmit = async (values: z.infer<typeof replySchema>) => {
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please sign in to reply.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const optimisticReply: Reply = {
      id: `pending-${Date.now()}`,
      threadId: thread.id,
      body: values.body,
      authorId: user.uid,
      replyToAuthorId: replyTo?.authorId,
      status: 'published',
      createdAt: new Date(),
      pending: true,
    };
    
    setReplies(prev => [...prev, optimisticReply]);

    try {
      await createReply({
        threadId: thread.id,
        body: values.body,
        authorId: user.uid,
        replyToAuthorId: replyTo?.authorId,
      });

      form.reset();
      setReplyTo(null);
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not post reply: ${error.message}`, variant: 'destructive' });
      // Remove optimistic reply on failure
      setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
    }
    setLoading(false);
  };
  
  const handleReplyTo = (author: UserProfile) => {
    setReplyTo({ authorId: author.uid, displayName: author.displayName });
    replyFormBodyRef.current?.focus();
  }

  const threadAuthor = useMemo(() => authors[thread.authorId], [authors, thread.authorId]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="capitalize">{thread.intent}</Badge>
            {thread.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{thread.title}</h1>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Avatar className="h-9 w-9">
            <AvatarImage src={threadAuthor?.avatarUrl ?? undefined} />
            <AvatarFallback>{threadAuthor?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-semibold text-foreground">{threadAuthor?.displayName ?? '...'}</span>
            <span className="mx-1">·</span>
            <span>Posted {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6 text-base leading-relaxed whitespace-pre-wrap">
          {thread.body}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</h2>
      
      <div className="space-y-6">
        {replies.map(reply => {
          const replyAuthor = authors[reply.authorId];
          const repliedToAuthor = reply.replyToAuthorId ? authors[reply.replyToAuthorId] : null;

          return (
            <Card key={reply.id} className={`p-5 ${reply.pending ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={replyAuthor?.avatarUrl ?? undefined} />
                  <AvatarFallback>{replyAuthor?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{replyAuthor?.displayName ?? '...'}</p>
                        {repliedToAuthor && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <CornerDownRight size={14}/>
                                @{repliedToAuthor.displayName}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reply.pending ? 'Sending...' : formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{reply.body}</p>

                  {user && user.uid !== reply.authorId && !thread.isLocked && (
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2 h-auto p-1" onClick={() => replyAuthor && handleReplyTo(replyAuthor)}>
                        <MessageSquare size={14} className="mr-1" />
                        Reply
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {user && !thread.isLocked && (
        <Card className="mt-8 p-6 sticky bottom-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {replyTo && (
                <div className="flex items-center justify-between text-sm p-2 bg-secondary rounded-md">
                    <p className="text-secondary-foreground">Replying to <span className="font-semibold">@{replyTo.displayName}</span></p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
                        <X size={14} />
                    </Button>
                </div>
              )}
               <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Reply</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        ref={replyFormBodyRef}
                        placeholder={replyTo ? `Write your reply to ${replyTo.displayName}...` : "Write your reply here..."} 
                        rows={3} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post Reply
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {user && thread.isLocked && (
        <div className="mt-8 p-4 text-center bg-secondary rounded-lg">
            <p className="text-secondary-foreground font-medium">This thread has been locked. No new replies can be posted.</p>
        </div>
      )}
    </div>
  );
}
