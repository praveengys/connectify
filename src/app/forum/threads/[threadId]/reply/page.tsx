
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams, notFound, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getThread, createReply, getReply, getUserProfile } from '@/lib/firebase/firestore';
import type { Thread, Reply, UserProfile } from '@/lib/types';
import { Loader2, CornerDownRight } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function ReplyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const threadId = params.threadId as string;
  const parentReplyId = searchParams.get('to');

  const [content, setContent] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [parentReply, setParentReply] = useState<Reply | null>(null);
  const [parentAuthor, setParentAuthor] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!threadId) {
      console.error('No threadId found in params');
      notFound();
      return;
    }
    
    if (authLoading) return;
    if (!user) {
      const redirectUrl = parentReplyId
        ? `/forum/threads/${threadId}/reply?to=${parentReplyId}`
        : `/forum/threads/${threadId}/reply`;
      router.replace(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const threadData = await getThread(threadId);
        if (!threadData || threadData.isLocked) {
          notFound();
        }
        setThread(threadData);

        if (parentReplyId) {
          const parentReplyData = await getReply(threadId, parentReplyId);
          // Allow replies only to top-level comments
          if (parentReplyData && parentReplyData.depth === 0) {
            setParentReply(parentReplyData);
            if (parentReplyData.authorId) {
              const author = await getUserProfile(parentReplyData.authorId);
              setParentAuthor(author);
            }
          } else if (parentReplyData) {
            // It's a nested reply, which we don't allow replying to.
             toast({
              title: "Cannot reply to this",
              description: "You can only reply to top-level responses.",
              variant: "destructive",
            });
            router.push(`/forum/threads/${threadId}`);
            return;
          }
        }
      } catch(error) {
        console.error("Error fetching data for reply page:", error);
        toast({ title: "Error", description: "Could not load necessary data.", variant: "destructive" });
        router.push(`/forum/threads/${threadId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, threadId, parentReplyId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !thread) return;

    setSubmitting(true);
    try {
      await createReply({
        threadId: thread.id,
        authorId: user.uid,
        body: content,
        parentReplyId: parentReplyId || null,
      });

      toast({
        title: 'Success!',
        description: 'Your reply has been posted.',
      });
      router.push(`/forum/threads/${threadId}`);
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast({
        title: 'Error',
        description: `Could not post reply: ${error.message}`,
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!thread) {
    return notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
            <CardDescription>
              Replying in thread: <span className="font-semibold text-foreground">{thread.title}</span>
            </CardDescription>
            {parentReply && parentAuthor && (
              <div className="pt-4 flex items-start gap-3 text-sm text-muted-foreground border-t mt-4">
                <CornerDownRight size={16} className="mt-1 shrink-0" />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span>Replying to</span>
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={parentAuthor.avatarUrl ?? undefined} alt={parentAuthor.displayName} />
                        <AvatarFallback>{parentAuthor.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{parentAuthor.displayName}</span>
                  </div>
                  <blockquote className="mt-2 pl-3 border-l-2 text-foreground/80 italic">
                    {parentReply.body}
                  </blockquote>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your reply here..."
                className="w-full p-3 border rounded-lg h-40"
                maxLength={5000}
                required
              />
              <div className="flex items-center justify-end gap-2">
                <Button asChild variant="ghost">
                  <Link href={`/forum/threads/${threadId}`}>
                    Cancel
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post Reply
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
