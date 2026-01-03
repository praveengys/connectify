
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { add, format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getAvailableTimeSlots } from '@/lib/firebase/firestore';
import { bookDemo } from '@/lib/firebase/client-actions';
import type { DemoSlot } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  name: z.string().min(2, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
  slotId: z.string({ required_error: 'Please select a time slot.' }),
});

export default function BookDemoClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<DemoSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || '',
      email: user?.email || '',
      notes: '',
    },
  });

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    if (startOfDay(date) < startOfDay(new Date())) {
        toast({
            title: 'Invalid Date',
            description: 'Please select a date in the future.',
            variant: 'destructive',
        });
        setSelectedDate(undefined);
        setAvailableSlots([]);
        return;
    }

    setSelectedDate(date);
    setLoadingSlots(true);
    form.resetField('slotId');
    try {
      const slots = await getAvailableTimeSlots(date);
      setAvailableSlots(slots);
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
     if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to book a demo.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await bookDemo({
        slotId: values.slotId,
        name: values.name,
        email: values.email,
        notes: values.notes || '',
        uid: user.uid
      });
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        title: 'Unable to Book Demo',
        description: error.message || 'This slot may have just been taken. Please refresh and try again.',
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

  const selectedSlotId = form.watch('slotId');
  const selectedSlot = availableSlots.find(slot => slot.id === selectedSlotId);
  const endTime = selectedSlot && selectedDate ? format(add(new Date(`${selectedSlot.date}T${selectedSlot.startTime}`), { minutes: 30 }), 'p') : '';

  return (
    <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left side: Calendar */}
                <div className="p-6 lg:p-8 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-semibold mb-4 self-start">1. Select a Date & Time</h2>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        fromDate={new Date()}
                        toDate={add(new Date(), { months: 2 })}
                        disabled={(date) => date < startOfDay(new Date())}
                        initialFocus
                    />
                    <div className="w-full mt-4">
                        {loadingSlots && <div className="flex justify-center py-4"><Loader2 className="animate-spin"/></div>}

                        {!loadingSlots && selectedDate && (
                             <FormField
                                control={form.control}
                                name="slotId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-center block mb-2">Available Times for {format(selectedDate, 'PPP')}</FormLabel>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-3 gap-2"
                                    >
                                        {availableSlots.length > 0 ? availableSlots.map(slot => (
                                        <FormItem key={slot.id}>
                                            <FormControl>
                                            <RadioGroupItem value={slot.id} className="sr-only" id={slot.id} />
                                            </FormControl>
                                            <Label htmlFor={slot.id} className="block border rounded-md p-3 text-center cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                                            {format(new Date(`1970-01-01T${slot.startTime}`), 'p')}
                                            </Label>
                                        </FormItem>
                                        )) : <p className="text-sm text-muted-foreground col-span-3 text-center">No available slots for this day.</p>}
                                    </RadioGroup>
                                    <FormMessage className="text-center pt-2" />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>
                
                {/* Right side: Form */}
                <div className="p-6 lg:p-8 bg-secondary/30 md:border-l">
                     <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <h2 className="text-xl font-semibold">2. Your Details</h2>
                        
                        {selectedSlot && selectedDate && (
                            <div className="p-3 text-sm rounded-md bg-muted text-center text-muted-foreground">
                                Your demo is scheduled for {format(selectedDate, 'PPP')} from {format(new Date(`1970-01-01T${selectedSlot.startTime}`), 'p')} to {endTime}.
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

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !selectedSlot}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Book Demo
                        </Button>
                      </form>
                    </Form>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
