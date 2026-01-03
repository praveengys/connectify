
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { notFound, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Reply, Thread, UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/firebase/client-actions';
import { createReply } from '@/lib/firebase/client-actions';
import { MessageSquare, CornerDownRight, Lock, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import ChatRoom from './ChatRoom';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import Link from 'next/link';
import { useFirebase } from '@/firebase/client-provider';

type ThreadViewClientProps = {
  threadId: string;
};

type GroupedReplies = {
  [key: string]: {
    parent: Reply;
    children: Reply[];
  };
};

export default function ThreadViewClient({ threadId }: ThreadViewClientProps) {
  const { firestore } = useFirebase();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>({});
  const [replies, setReplies] = useState<Reply[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);


  const fetchAndCacheAuthors = useCallback(async (authorIds: string[]) => {
    const newAuthorIds = authorIds.filter(id => id && !authors[id]);
    if (newAuthorIds.length === 0) return;

    const uniqueNewAuthorIds = [...new Set(newAuthorIds)];
    try {
      const fetchedAuthors = await Promise.all(uniqueNewAuthorIds.map(id => getUserProfile(firestore, id)));
      setAuthors(prev => {
        const newAuthors = { ...prev };
        fetchedAuthors.forEach(author => {
          if (author) newAuthors[author.uid] = author;
        });
        return newAuthors;
      });
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  }, [authors, firestore]);

  // Initial data load and real-time listeners
  useEffect(() => {
    if (authLoading || !firestore) return;
    
    setPageLoading(true);
    
    // Listener for the main thread document
    const threadRef = doc(firestore, 'threads', threadId);
    const unsubscribeThread = onSnapshot(threadRef, (docSnap) => {
      if (docSnap.exists()) {
        const threadData = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() ?? new Date(),
          updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate() ?? new Date(),
        } as Thread;
        setThread(threadData);
        if (threadData.authorId && !authors[threadData.authorId]) {
          getUserProfile(firestore, threadData.authorId).then(author => {
            if (author) setAuthors(prev => ({...prev, [author.uid]: author}));
          });
        }
      } else {
        notFound();
      }
      setPageLoading(false);
    }, () => {
      notFound();
    });

    // Listener for replies
    const repliesRef = collection(firestore, 'threads', threadId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const unsubscribeReplies = onSnapshot(q, (snapshot) => {
      const newReplies = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          } as Reply;
        }).filter(reply => reply.status === 'published');
      
      setReplies(newReplies);

      const authorIds = newReplies.flatMap(r => [r.authorId, r.replyToAuthorId]).filter(Boolean) as string[];
      const uniqueAuthorIds = [...new Set(authorIds)];
      
      // Fetch any authors not already in state
      const missingAuthorIds = uniqueAuthorIds.filter(id => !authors[id]);
      if (missingAuthorIds.length > 0) {
        Promise.all(missingAuthorIds.map(id => getUserProfile(firestore, id))).then(fetchedAuthors => {
            setAuthors(prev => {
                const updatedAuthors = {...prev};
                fetchedAuthors.forEach(author => {
                    if (author) updatedAuthors[author.uid] = author;
                });
                return updatedAuthors;
            });
        });
      }
    });

    return () => {
      unsubscribeThread();
      unsubscribeReplies();
    };
  }, [threadId, authLoading, firestore, authors]);

  const threadAuthor = useMemo(() => thread ? authors[thread.authorId] : undefined, [authors, thread]);
  
  const groupedReplies = useMemo(() => {
    const topLevelReplies = replies.filter(r => !r.parentReplyId);
    const nestedReplies = replies.filter(r => r.parentReplyId);

    const groups: GroupedReplies = {};

    topLevelReplies.forEach(parent => {
      groups[parent.id] = { parent, children: [] };
    });

    nestedReplies.forEach(child => {
      if (child.parentReplyId && groups[child.parentReplyId]) {
        groups[child.parentReplyId].children.push(child);
      }
    });

    return Object.values(groups).sort((a, b) => new Date(a.parent.createdAt).getTime() - new Date(b.parent.createdAt).getTime());
  }, [replies]);

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !user || !thread || authLoading) {
      if(authLoading) toast({ title: "Please wait", description: "Authentication is still loading.", variant: "destructive" });
      if(!user) toast({ title: "Not Authenticated", description: "You must be signed in to reply.", variant: "destructive" });
      return;
    };

    setSubmitting(true);
    try {
      await createReply(firestore, {
        threadId: thread.id,
        authorId: user.uid,
        body: replyContent,
        parentReplyId: replyingTo ? replyingTo.id : null,
      });

      toast({
        title: 'Success!',
        description: 'Your reply has been posted.',
      });
      setReplyContent('');
      setReplyingTo(null);
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast({
        title: 'Error',
        description: `Could not post reply: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
        setSubmitting(false);
    }
  };
  
  if (pageLoading || !thread) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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
            <AvatarFallback>{threadAuthor?.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-semibold text-foreground">{threadAuthor?.displayName ?? '...'}</span>
            <span className="mx-1">·</span>
            <span>Posted {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      <Card className="mb-6">
        <CardContent className="p-6 text-base leading-relaxed whitespace-pre-wrap">{thread.body}</CardContent>
      </Card>
      
      {/* Live Chat component is disabled for now to focus on threaded replies */}
      {/* 
      <Separator className="my-8" />
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Live Chat</h2>
        <ChatRoom thread={thread} />
      </div> 
      */}
      
      <Separator className="my-8" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{thread.replyCount || 0} {(thread.replyCount || 0) === 1 ? 'Response' : 'Responses'}</h2>
      </div>

      {/* Reply Submission Form */}
      {user && !thread.isLocked && (
        <Card className="mb-6">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <Avatar className="h-9 w-9 mt-1">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                        {replyingTo && (
                            <div className="text-sm text-muted-foreground mb-2 p-2 bg-secondary rounded-md">
                                Replying to <span className="font-semibold text-foreground">@{authors[replyingTo.authorId]?.displayName || '...'}</span>
                                <Button type="button" variant="ghost" size="sm" className="ml-2 h-auto p-1" onClick={() => setReplyingTo(null)}>Cancel</Button>
                            </div>
                        )}
                        <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={replyingTo ? 'Write your reply...' : 'Add to the discussion...'}
                            rows={4}
                            className="w-full"
                        />
                        <div className="flex justify-end mt-4">
                            <Button 
                                type="button" 
                                onClick={handleReplySubmit} 
                                disabled={isSubmitting || authLoading || !replyContent.trim()}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post Response
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      {/* Replies List */}
      <div className="space-y-6">
        {groupedReplies.map(({ parent, children }) => {
          const parentAuthor = authors[parent.authorId];
          return (
            <Card key={parent.id} className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={parentAuthor?.avatarUrl ?? undefined} />
                  <AvatarFallback>{parentAuthor?.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{parentAuthor?.displayName ?? '...'}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(parent.createdAt), { addSuffix: true })}</p>
                  </div>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{parent.body}</p>
                  {user && !thread.isLocked && parent.parentReplyId === null && (
                    <div className="mt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setReplyingTo(parent)}>
                         <CornerDownRight size={14} className="mr-2" />
                         Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {children.length > 0 && (
                <div className="ml-8 mt-4 space-y-4 border-l-2 pl-6">
                  {children.map(child => {
                    const childAuthor = authors[child.authorId];
                    const repliedToAuthor = child.parentReplyId ? authors[parent.authorId] : null;
                    return (
                      <div key={child.id} className="flex items-start gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={childAuthor?.avatarUrl ?? undefined} />
                          <AvatarFallback>{childAuthor?.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{childAuthor?.displayName ?? '...'}</p>
                              {repliedToAuthor && (
                                <p className="text-sm text-muted-foreground">
                                  to @{repliedToAuthor.displayName}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(child.createdAt), { addSuffix: true })}</p>
                          </div>
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{child.body}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {user && thread.isLocked && (
        <div className="mt-8 p-4 text-center bg-secondary rounded-lg flex items-center justify-center gap-2">
          <Lock size={16} />
          <p className="text-secondary-foreground font-medium">This thread has been locked. No new replies can be posted.</p>
        </div>
      )}
       {!user && !authLoading && (
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              <Link href="/login" className="text-primary font-semibold hover:underline">Log in</Link> or <Link href="/signup" className="text-primary font-semibold hover:underline">sign up</Link> to join the discussion.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
