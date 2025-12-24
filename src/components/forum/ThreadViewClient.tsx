
'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { initializeFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Reply, Thread, UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/firebase/firestore';
import { MessageSquare, CornerDownRight, Lock } from 'lucide-react';
import { doc } from 'firebase/firestore';
import ChatRoom from './ChatRoom';
import { Separator } from '../ui/separator';

type ThreadViewClientProps = {
  initialThread: Thread;
  initialReplies: Reply[]; 
  initialAuthors: Record<string, UserProfile>;
};

export default function ThreadViewClient({ initialThread, initialReplies, initialAuthors }: ThreadViewClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [thread, setThread] = useState<Thread>(initialThread);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>(initialAuthors);

  useEffect(() => {
    if (loading || !user) {
        // Don't attach listener if auth state is not confirmed or user is not logged in.
        // Public users will see initial server-rendered data.
        return;
    }

    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', thread.id);

    const unsubscribe = onSnapshot(threadRef, async (docSnap) => {
      if (docSnap.exists()) {
        const threadData = docSnap.data({ serverTimestamps: 'estimate' }) as Thread;
        
        const repliesWithDates = (threadData.replies || []).map(r => ({
          ...r,
          createdAt: (r.createdAt as any)?.toDate ? (r.createdAt as any).toDate() : new Date(r.createdAt)
        }));

        setThread({
          ...threadData,
          id: docSnap.id,
          createdAt: (threadData.createdAt as any).toDate(),
          updatedAt: (threadData.updatedAt as any).toDate(),
          replies: repliesWithDates,
        });

        const authorIdsToFetch = new Set<string>([threadData.authorId]);
        repliesWithDates.forEach(r => {
            authorIdsToFetch.add(r.authorId);
            if(r.replyToAuthorId) {
                authorIdsToFetch.add(r.replyToAuthorId);
            }
        });
        
        const newAuthorsToFetch = Array.from(authorIdsToFetch).filter(id => !authors[id]);

        if (newAuthorsToFetch.length > 0) {
          const fetchedAuthors = await Promise.all(
            newAuthorsToFetch.map(id => getUserProfile(id))
          );
          setAuthors(prev => {
            const newAuthors = { ...prev };
            fetchedAuthors.forEach(author => {
              if (author) newAuthors[author.uid] = author;
            });
            return newAuthors;
          });
        }
      }
    }, (error) => {
      console.error("Firestore snapshot listener error:", error);
      toast({
        title: 'Real-time connection failed',
        description: 'Could not listen for thread updates. Please refresh the page.',
        variant: 'destructive',
      });
    });

    return () => unsubscribe();
  }, [thread.id, toast, authors, loading, user]);

  const threadAuthor = useMemo(() => authors[thread.authorId], [authors, thread.authorId]);
  
  const sortedReplies = useMemo(() => {
    return thread.replies?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || [];
  }, [thread.replies]);

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
      
      <Card className="mb-6">
        <CardContent className="p-6 text-base leading-relaxed whitespace-pre-wrap">
          {thread.body}
        </CardContent>
      </Card>

      <Separator className="my-8" />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Live Chat</h2>
        <ChatRoom thread={thread} />
      </div>

      <Separator className="my-8" />

       <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{sortedReplies.length} {sortedReplies.length === 1 ? 'Reply' : 'Replies'}</h2>
        {user && !thread.isLocked && (
            <Button asChild>
                <Link href={`/forum/threads/${thread.id}/reply`}>
                    <MessageSquare size={16} className="mr-2"/>
                    Post a Formal Reply
                </Link>
            </Button>
        )}
      </div>
      
      <div className="space-y-6">
        {sortedReplies.map(reply => {
          const replyAuthor = authors[reply.authorId];
          const repliedToAuthor = reply.replyToAuthorId ? authors[reply.replyToAuthorId] : null;

          return (
            <Card key={reply.id} className="p-5">
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
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{reply.body}</p>
                   {user && !thread.isLocked && (
                    <div className="mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/forum/threads/${thread.id}/reply?replyTo=${reply.authorId}`)}
                        >
                            <CornerDownRight size={14} className="mr-2" />
                            Reply
                        </Button>
                    </div>
                   )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {user && thread.isLocked && (
        <div className="mt-8 p-4 text-center bg-secondary rounded-lg flex items-center justify-center gap-2">
            <Lock size={16} />
            <p className="text-secondary-foreground font-medium">This thread has been locked. No new replies or chat messages can be posted.</p>
        </div>
      )}
    </div>
  );
}
