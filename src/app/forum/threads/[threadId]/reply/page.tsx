
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getThread, createReply } from '@/lib/firebase/firestore';
import type { Thread } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ReplyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const threadId = params.threadId as string;
  
  const [content, setContent] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/forum/threads/${threadId}/reply`);
      return;
    }

    const fetchThread = async () => {
      setLoading(true);
      const threadData = await getThread(threadId);
      if (!threadData || threadData.isLocked) {
        notFound();
      }
      setThread(threadData);
      setLoading(false);
    };

    fetchThread();
  }, [user, authLoading, threadId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !thread) return;

    setSubmitting(true);
    try {
      await createReply(thread.id, {
        authorId: user.uid,
        body: content,
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
