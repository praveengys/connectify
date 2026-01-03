
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createForum } from '@/lib/firebase/client-actions';
import { useAuth } from '@/hooks/use-auth';
import type { Forum } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(5, { message: 'Forum name must be at least 5 characters.' }).max(50, { message: 'Forum name cannot be more than 50 characters.' }),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(300, 'Description cannot be more than 300 characters.'),
});

type CreateForumFormProps = {
  onForumCreated: (forum: Forum) => void;
};

export default function CreateForumForm({ onForumCreated }: CreateForumFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a forum.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const newForum = await createForum(values.name, values.description, user.uid);
      
      toast({
        title: 'Forum Created!',
        description: 'Your new forum is now live and public.',
      });
      onForumCreated(newForum);
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast({
        title: 'Error creating forum',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forum Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 'Next.js Developers'" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="What is this forum about?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Forum
          </Button>
        </div>
      </form>
    </Form>
  );
}
