
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToNewsletter } from '@/lib/firebase/client-actions';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function NewsletterForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const { isSubmitting, isSubmitSuccessful } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await subscribeToNewsletter(values.email);
      toast({
        title: 'Subscription Successful!',
        description: "Thanks for subscribing! We'll be in touch.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: 'Subscription Failed',
        description: 'Could not subscribe. Please try again later.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -bottom-12 -left-12 w-32 h-32 text-primary/5">
        <Mail className="w-full h-full" strokeWidth={0.5}/>
      </div>
      <CardHeader>
        <CardTitle>Stay in Touch</CardTitle>
        <CardDescription>
          Subscribe to our Newsletter, & we’ll send you the latest news from BuddyBoss.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" className="h-11 w-11 flex-shrink-0" disabled={isSubmitting} aria-label="Subscribe to newsletter">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
