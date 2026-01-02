
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { add, format, startOfDay } from 'date-fns';
import { initializeFirebase } from '@/firebase';
import { createDemoSlot } from '@/lib/firebase/firestore';
import type { DemoSlot } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '../ui/badge';

const formSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  timeSlots: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one time slot.',
  }),
});

export default function SlotManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<DemoSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeSlots: [],
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

  useEffect(() => {
    const { firestore } = initializeFirebase();
    const slotsRef = collection(firestore, 'demoSlots');
    const q = query(slotsRef, orderBy('date', 'desc'), orderBy('startTime', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const slotsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DemoSlot));
      setSlots(slotsData);
      setLoadingSlots(false);
    });

    return () => unsubscribe();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const dateStr = format(values.date, 'yyyy-MM-dd');
    
    try {
        // Check for existing slots to prevent duplicates
        const { firestore } = initializeFirebase();
        const slotsRef = collection(firestore, 'demoSlots');
        const q = query(slotsRef, where('date', '==', dateStr), where('startTime', 'in', values.timeSlots));
        const existingSlotsSnap = await getDocs(q);
        const existingTimes = existingSlotsSnap.docs.map(d => d.data().startTime);

        const newTimeSlots = values.timeSlots.filter(time => !existingTimes.includes(time));

        if (newTimeSlots.length === 0) {
            toast({ title: 'No new slots to add', description: 'All selected slots already exist for this date.', variant: 'destructive' });
            setLoading(false);
            return;
        }

      const promises = newTimeSlots.map(time =>
        createDemoSlot({
          date: dateStr,
          startTime: time,
          isBooked: false,
        })
      );
      await Promise.all(promises);
      toast({
        title: 'Success',
        description: `${newTimeSlots.length} new slot(s) have been created for ${format(values.date, 'PPP')}.`,
      });
      form.reset();
      form.setValue('timeSlots', []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Demo Slots</CardTitle>
          <CardDescription>Select a date and the time slots you want to make available for booking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < startOfDay(new Date())}
                        initialFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeSlots"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Available Times</FormLabel>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableTimeSlots.map((item) => (
                        <FormField
                            key={item}
                            control={form.control}
                            name="timeSlots"
                            render={({ field }) => {
                            return (
                                <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                        ? field.onChange([...(field.value || []), item])
                                        : field.onChange(
                                            field.value?.filter(
                                                (value) => value !== item
                                            )
                                            );
                                    }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">
                                    {format(new Date(`1970-01-01T${item}`), 'p')}
                                </FormLabel>
                                </FormItem>
                            );
                            }}
                        />
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Create Slots
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Slots</CardTitle>
          <CardDescription>A list of all created demo slots and their status.</CardDescription>
        </CardHeader>
        <CardContent>
            {loadingSlots ? (
                 <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {slots.map(slot => (
                            <TableRow key={slot.id}>
                                <TableCell>{format(new Date(slot.date), 'PPP')}</TableCell>
                                <TableCell>{format(new Date(`1970-01-01T${slot.startTime}`), 'p')}</TableCell>
                                <TableCell>
                                    <Badge variant={slot.isBooked ? "destructive" : "secondary"}>
                                        {slot.isBooked ? "Booked" : "Available"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                         {slots.length === 0 && (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">No slots created yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
