'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Category, Forum } from '@/lib/types';
import { createThread } from '@/lib/firebase/firestore';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const formSchema = z.object({
  forumId: z.string().min(1, { message: 'Please select a forum.' }),
  categoryId: z.string().min(1, { message: 'Please select a category.' }),
  intent: z.enum(['question', 'discussion', 'announcement', 'feedback', 'help'], { required_error: 'You must select a thread intent.' }),
  title: z.string().min(10, 'Title must be at least 10 characters.').max(150, 'Title cannot exceed 150 characters.'),
  body: z.string().min(20, 'The body of your post must be at least 20 characters.'),
  tags: z.string().optional(),
});

export default function NewThreadForm() {
  const [loading, setLoading] = useState(false);
  const [forums, setForums] = useState<Forum[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchForumsAndCategories() {
      if (!user) return;
      const { firestore } = initializeFirebase();
      
      // Fetch active, public forums
      const forumQuery = query(collection(firestore, 'forums'), where('status', '==', 'active'), where('visibility', '==', 'public'));
      const forumSnapshot = await getDocs(forumQuery);
      setForums(forumSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Forum)));
      
      // Fetch all categories
      const categoryQuery = query(collection(firestore, 'categories'), orderBy('name'));
      const categorySnapshot = await getDocs(categoryQuery);
      setCategories(categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }
    fetchForumsAndCategories();
  }, [user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      tags: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: 'Not authenticated', description: 'You must be logged in to create a thread.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const threadData = {
        ...values,
        authorId: user.uid,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        status: 'published' as const,
        isLocked: false,
        isPinned: false,
      };
      
      const newThread = await createThread(threadData);
      toast({ title: 'Success!', description: 'Your new discussion has been posted.' });
      router.push(`/forum/threads/${newThread.id}`);

    } catch (error: any) {
      toast({ title: 'Error', description: `Could not post your thread: ${error.message}`, variant: 'destructive' });
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Start a New Discussion</CardTitle>
        <CardDescription>Share your thoughts with the community. Choose the right category and intent to get the best responses.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="forumId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Forum</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a forum" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {forums.map(forum => <SelectItem key={forum.id} value={forum.id}>{forum.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="intent"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>What is your intent?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select the purpose of your post..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="question">Question</SelectItem>
                            <SelectItem value="discussion">Discussion</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="help">Request for Help</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="A clear, concise title for your discussion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write the main content of your post here. Be descriptive!" {...field} rows={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., javascript, react, firebase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !user}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Discussion
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
