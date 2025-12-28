
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
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
import { createReply, getUserProfile } from '@/lib/firebase/firestore';
import { MessageSquare, CornerDownRight, Lock, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import ChatRoom from './ChatRoom';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

type ThreadViewClientProps = {
  initialThread: Thread;
  initialReplies: Reply[];
  initialAuthors: Record<string, UserProfile>;
};

type GroupedReplies = {
  [key: string]: {
    parent: Reply;
    children: Reply[];
  };
};

export default function ThreadViewClient({ initialThread, initialReplies, initialAuthors }: ThreadViewClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<Thread>(initialThread);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>(initialAuthors);
  const [replies, setReplies] = useState<Reply[]>(initialReplies);

  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);


  const fetchAndCacheAuthors = useCallback(async (authorIds: string[]) => {
    const newAuthorIds = authorIds.filter(id => id && !authors[id]);
    if (newAuthorIds.length === 0) return;

    const uniqueNewAuthorIds = [...new Set(newAuthorIds)];
    try {
      const fetchedAuthors = await Promise.all(uniqueNewAuthorIds.map(id => getUserProfile(id)));
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
  }, [authors]);


  useEffect(() => {
    if (authLoading) return;

    const { firestore } = initializeFirebase();
    const threadRef = doc(firestore, 'threads', thread.id);
    
    const unsubscribeThread = onSnapshot(threadRef, (docSnap) => {
      if (docSnap.exists()) {
        const threadData = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate(),
        } as Thread;
        setThread(threadData);
        if (threadData.authorId && !authors[threadData.authorId]) {
            fetchAndCacheAuthors([threadData.authorId]);
        }
      }
    }, (error) => {
        console.error("Firestore thread listener error:", error);
        toast({
            title: 'Real-time connection failed',
            description: 'Could not listen for thread updates.',
            variant: 'destructive',
        });
    });

    const repliesRef = collection(firestore, 'threads', thread.id, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));

    const unsubscribeReplies = onSnapshot(q, (snapshot) => {
      const newReplies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      } as Reply)).filter(reply => reply.status === 'published');
      
      setReplies(newReplies);

      const authorIds = newReplies.flatMap(r => [r.authorId, r.replyToAuthorId]).filter(Boolean) as string[];
      fetchAndCacheAuthors(authorIds);
    }, (error) => {
      console.error("Firestore replies listener error:", error);
      toast({
        title: 'Real-time connection failed',
        description: 'Could not listen for new replies. Please refresh the page.',
        variant: 'destructive',
      });
    });

    return () => {
      unsubscribeThread();
      unsubscribeReplies();
    };
  }, [thread.id, toast, authLoading, fetchAndCacheAuthors]);

  const threadAuthor = useMemo(() => authors[thread.authorId], [authors, thread.authorId]);
  
  const groupedReplies = useMemo(() => {
    const depth0 = replies.filter(r => r.depth === 0);
    const depth1 = replies.filter(r => r.depth === 1);

    const groups: GroupedReplies = {};

    depth0.forEach(parent => {
      groups[parent.id] = { parent, children: [] };
    });

    depth1.forEach(child => {
      if (child.parentReplyId && groups[child.parentReplyId]) {
        groups[child.parentReplyId].children.push(child);
      }
    });

    return Object.values(groups).sort((a, b) => new Date(a.parent.createdAt).getTime() - new Date(b.parent.createdAt).getTime());
  }, [replies]);

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !user || authLoading) {
      if(authLoading) toast({ title: "Please wait", description: "Authentication is still loading.", variant: "destructive" });
      if(!user) toast({ title: "Not Authenticated", description: "You must be signed in to reply.", variant: "destructive" });
      return;
    };

    setSubmitting(true);
    try {
      await createReply({
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
        <CardContent className="p-6 text-base leading-relaxed whitespace-pre-wrap">{thread.body}</CardContent>
      </Card>
      <Separator className="my-8" />
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Live Chat</h2>
        <ChatRoom thread={thread} />
      </div>
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
                  <AvatarFallback>{parentAuthor?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{parentAuthor?.displayName ?? '...'}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(parent.createdAt), { addSuffix: true })}</p>
                  </div>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{parent.body}</p>
                  {user && !thread.isLocked && (
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
                    const repliedToAuthor = authors[child.replyToAuthorId || ''];
                    return (
                      <div key={child.id} className="flex items-start gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={childAuthor?.avatarUrl ?? undefined} />
                          <AvatarFallback>{childAuthor?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{childAuthor?.displayName ?? '...'}</p>
                              {repliedToAuthor && (
                                <p className="text-sm text-muted-foreground">
                                  to @{repliedToAuthor.username}
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
    </div>
  );
}

    

    