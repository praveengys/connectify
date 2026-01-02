
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
  timeSlot: z.string({ required_error: 'Please select a time slot.' }),
});

export default function BookDemoClient() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      notes: '',
    },
  });

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    if (startOfDay(date) < startOfDay(new Date())) {
        toast({
            title: 'Invalid Date',
            description: 'Please select a date in the future.',
            variant: 'destructive',
        });
        setSelectedDate(undefined);
        return;
    }

    setSelectedDate(date);
    form.resetField('timeSlot');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedDate) {
      toast({ title: 'Please select a date.', variant: 'destructive' });
      return;
    }
    try {
      const bookingDetails = {
        date: selectedDate,
        startTime: values.timeSlot,
        duration: 30,
        name: values.name,
        email: values.email,
        notes: values.notes || '',
      };
      await bookDemo(bookingDetails);
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        title: 'Unable to Book Demo',
        description: error.message || 'Please try again or contact support.',
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
                    Your request has been submitted. Our team will review it and send a calendar invite to your email upon approval.
                </p>
            </CardContent>
        </Card>
    );
  }


  const selectedTime = form.watch('timeSlot');
  const endTime = selectedTime && selectedDate ? format(add(new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`), { minutes: 30 }), 'p') : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>1. Select a Date</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            fromDate={new Date()}
            toDate={add(new Date(), { months: 2 })}
            disabled={(date) => date < startOfDay(new Date())}
            initialFocus
          />
        </CardContent>
      </Card>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>2. Request Your Demo</CardTitle>
              <CardDescription>Fill in your details and we'll confirm your booking via email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-secondary/30">
                    <p className="font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'No date selected'}
                    </p>
                </div>
              
                {selectedDate && (
                    <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a time slot" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {timeSlots.map(slot => (
                                    <SelectItem key={slot} value={slot}>
                                        {format(new Date(`1970-01-01T${slot}`), 'p')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )}
                    />
                )}

                {selectedTime && (
                    <div className="p-3 text-sm rounded-md bg-muted text-center text-muted-foreground">
                        You are requesting a demo from {format(new Date(`1970-01-01T${selectedTime}`), 'p')} to {endTime}.
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

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !selectedTime}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Demo
                </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
