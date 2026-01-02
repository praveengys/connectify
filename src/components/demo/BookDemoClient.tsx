
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { add, format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { bookDemo } from '@/lib/firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  name: z.string().min(2, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
  date: z.date({ required_error: 'Please select a date.' }),
  time: z.string({ required_error: 'Please select a time.' }),
});

export default function BookDemoClient() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      notes: '',
    },
  });
  
  const availableTimeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await bookDemo({
        name: values.name,
        email: values.email,
        notes: values.notes || '',
        date: format(values.date, 'yyyy-MM-dd'),
        startTime: values.time,
        status: 'pending', // Set status to pending for admin approval
      });
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        title: 'Unable to Book Demo',
        description: error.message || 'This slot may have just been taken. Please try another time.',
        variant: 'destructive',
      });
    }
  };
  
  if (isSuccess) {
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardContent className="p-10 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Demo Request Sent!</h2>
                <p className="text-muted-foreground">
                    Your request has been submitted for approval. You will receive a confirmation email once it's scheduled.
                </p>
            </CardContent>
        </Card>
    );
  }

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const endTime = selectedTime && selectedDate ? format(add(new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`), { minutes: 30 }), 'p') : '';

  return (
    <Form {...form}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Select a Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          fromDate={new Date()}
                          toDate={add(new Date(), { months: 2 })}
                          disabled={(date) => date < startOfDay(new Date())}
                          initialFocus
                      />
                    </FormControl>
                    <FormMessage className="text-center pt-2" />
                  </FormItem>
                )}
              />
          </CardContent>
        </Card>

        <Card>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>2. Schedule Your Demo</CardTitle>
              <CardDescription>Fill in your details and we'll send you a calendar invite upon approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedDate}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={selectedDate ? "Select a time slot" : "Select a date first"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableTimeSlots.map(time => (
                                <SelectItem key={time} value={time}>
                                {format(new Date(`1970-01-01T${time}`), 'p')}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedTime && (
                    <div className="p-3 text-sm rounded-md bg-muted text-center text-muted-foreground">
                        Your demo will run from {format(new Date(`1970-01-01T${selectedTime}`), 'p')} to {endTime}.
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Email</FormLabel>
                            <FormControl><Input placeholder="john.doe@company.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Goals or Notes (Optional)</FormLabel>
                            <FormControl><Textarea placeholder="e.g., Interested in market analysis for SaaS startups." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !selectedTime || !selectedDate}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Demo
                </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </Form>
  );
}
