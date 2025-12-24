
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams, notFound, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getThread, createReply, getUserProfile } from '@/lib/firebase/firestore';
import type { Thread, UserProfile } from '@/lib/types';
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
  const replyToAuthorId = searchParams.get('replyTo');

  const [content, setContent] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [replyToAuthor, setReplyToAuthor] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirectUrl = replyToAuthorId
        ? `/forum/threads/${threadId}/reply?replyTo=${replyToAuthorId}`
        : `/forum/threads/${threadId}/reply`;
      router.replace(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const [threadData, authorData] = await Promise.all([
        getThread(threadId),
        replyToAuthorId ? getUserProfile(replyToAuthorId) : Promise.resolve(null),
      ]);
      
      if (!threadData || threadData.isLocked) {
        notFound();
      }
      setThread(threadData);
      setReplyToAuthor(authorData);
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, threadId, replyToAuthorId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !thread) return;

    setSubmitting(true);
    try {
      await createReply(thread.id, {
        authorId: user.uid,
        body: content,
        replyToAuthorId: replyToAuthorId || undefined,
      });

      toast({
        title: 'Success!',
        description: 'Your reply has been posted.',
      });
      router.push(`/forum/threads/${threadId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to post reply: ${error.message}`,
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(height.14))] w-full items-center justify-center bg-background">
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
              Replying to: <span className="font-semibold text-foreground">{thread.title}</span>
            </CardDescription>
            {replyToAuthor && (
              <div className="pt-4 flex items-center gap-2 text-sm text-muted-foreground border-t mt-4">
                <CornerDownRight size={16} />
                <span>Replying to</span>
                <Avatar className="h-6 w-6">
                    <AvatarImage src={replyToAuthor.avatarUrl ?? undefined} alt={replyToAuthor.displayName} />
                    <AvatarFallback>{replyToAuthor.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-foreground">{replyToAuthor.displayName}</span>
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
