
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getAvailableTimeSlots, bookDemo } from '@/lib/firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
  timeSlot: z.string({ required_error: 'Please select a time slot.' }),
});

export default function BookDemoClient() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      notes: '',
    },
  });

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    // Prevent selecting past dates
    if (startOfDay(date) < startOfDay(new Date())) {
        toast({
            title: 'Invalid Date',
            description: 'Please select a date in the future.',
            variant: 'destructive',
        });
        setSelectedDate(undefined);
        setTimeSlots([]);
        return;
    }

    setSelectedDate(date);
    setLoadingSlots(true);
    form.resetField('timeSlot');
    try {
      const slots = await getAvailableTimeSlots(date);
      setTimeSlots(slots);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch available time slots.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSlots(false);
    }
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
                <h2 className="text-2xl font-bold mb-2">Demo Scheduled Successfully!</h2>
                <p className="text-muted-foreground">
                    Your demo has been booked. A calendar invite has been sent to your email.
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
              <CardTitle>2. Schedule Your Demo</CardTitle>
              <CardDescription>Fill in your details and we'll send you a calendar invite.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-secondary/30">
                    <p className="font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'No date selected'}
                    </p>
                </div>
              
                {loadingSlots && <div className="flex justify-center py-4"><Loader2 className="animate-spin"/></div>}

                {!loadingSlots && selectedDate && (
                    <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Available Times</FormLabel>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-2"
                        >
                            {timeSlots.length > 0 ? timeSlots.map(slot => (
                            <FormItem key={slot}>
                                <FormControl>
                                <RadioGroupItem value={slot} className="sr-only" id={slot} />
                                </FormControl>
                                <Label htmlFor={slot} className="block border rounded-md p-3 text-center cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                                {format(new Date(`1970-01-01T${slot}`), 'p')}
                                </Label>
                            </FormItem>
                            )) : <p className="text-sm text-muted-foreground col-span-3">No available slots for this day.</p>}
                        </RadioGroup>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}

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

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !selectedTime}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Book Demo
                </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
