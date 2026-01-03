'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createChatGroup } from '@/lib/firebase/client-actions';
import { useAuth } from '@/hooks/use-auth';
import type { Group } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Group name must be at least 3 characters.' }).max(50, { message: 'Group name cannot be more than 50 characters.' }),
  type: z.enum(['public', 'private'], { required_error: 'You must select a group type.'}),
});

type CreateGroupFormProps = {
  onGroupCreated: () => void;
};

export default function CreateGroupForm({ onGroupCreated }: CreateGroupFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'public',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a group.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      await createChatGroup(values.name, values.type, user.uid);
      
      toast({
        title: 'Group Created!',
        description: `The group "${values.name}" is now live.`,
      });
      onGroupCreated();
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast({
        title: 'Error creating group',
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
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 'Weekend Hikers'" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Group Type</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                    >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="public" />
                        </FormControl>
                        <FormLabel className="font-normal">
                        Public - Anyone can join and view messages.
                        </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="private" />
                        </FormControl>
                        <FormLabel className="font-normal">
                        Private - Only invited members can join.
                        </FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Group
          </Button>
        </div>
      </form>
    </Form>
  );
}
