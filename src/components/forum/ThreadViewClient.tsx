'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Reply, Thread, UserProfile } from '@/lib/types';
import { createReply, getUserProfile } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';

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
  const [thread] = useState<Thread>(initialThread);
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>(initialAuthors);
  const [loading, setLoading] = useState(false);

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
    try {
      const newReply = await createReply({
        threadId: thread.id,
        body: values.body,
        authorId: user.uid,
      });

      // Optimistic UI update
      const newAuthorProfile = authors[user.uid] || await getUserProfile(user.uid);
      if (newAuthorProfile && !authors[user.uid]) {
        setAuthors(prev => ({...prev, [user.uid]: newAuthorProfile}));
      }

      setReplies(prevReplies => [...prevReplies, { ...newReply, author: user, createdAt: new Date() } as Reply]);
      form.reset();
      toast({ title: 'Success', description: 'Your reply has been posted.' });
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not post reply: ${error.message}`, variant: 'destructive' });
    }
    setLoading(false);
  };

  const threadAuthor = authors[thread.authorId];

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
          return (
            <Card key={reply.id} className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={replyAuthor?.avatarUrl ?? undefined} />
                  <AvatarFallback>{replyAuthor?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{replyAuthor?.displayName ?? '...'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{reply.body}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {user && (
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold mb-4">Post a Reply</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} placeholder="Write your reply here..." rows={5} />
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
    </div>
  );
}
