

'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { DemoBooking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2, ServerCrash, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { updateBookingStatus } from '@/lib/firebase/client-actions';

export default function BookingTable() {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [actionBooking, setActionBooking] = useState<DemoBooking | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ fn: () => void; text: string } | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');

  useEffect(() => {
    const { firestore } = initializeFirebase();
    const bookingsRef = collection(firestore, 'demoBookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData: DemoBooking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
      } as DemoBooking));
      setBookings(bookingsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching bookings:", err);
      setError("Failed to load booking data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = (booking: DemoBooking, action: 'approve' | 'deny') => {
    setActionBooking(booking);
    let title = '', description = '', actionFn: (() => void) | null = null, buttonText = 'Confirm';

    switch (action) {
      case 'approve':
        title = "Approve Demo Booking?";
        description = `This will schedule the demo for ${booking.name} on ${format(new Date(booking.date), 'PPP')} at ${format(new Date(`1970-01-01T${booking.startTime}`), 'p')}.`;
        actionFn = () => performAction(booking.id, updateBookingStatus(booking.id, 'scheduled'), 'Booking approved and scheduled.');
        buttonText = "Approve";
        break;
      case 'deny':
        title = "Deny Demo Booking?";
        description = "This will deny the demo request. The user will not be notified automatically.";
        actionFn = () => performAction(booking.id, updateBookingStatus(booking.id, 'denied'), 'Booking request denied.');
        buttonText = "Deny";
        break;
    }

    setConfirmTitle(title);
    setConfirmDescription(description);
    setConfirmAction({ fn: actionFn!, text: buttonText });
    setConfirmOpen(true);
  };

  const performAction = (bookingId: string, actionPromise: Promise<any>, successMessage: string) => {
    startTransition(async () => {
      try {
        await actionPromise;
        toast({ title: 'Success', description: successMessage });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const sortedBookings = useMemo(() => {
    return bookings.sort((a, b) => {
      const statusOrder = { pending: 0, scheduled: 1, denied: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime();
    });
  }, [bookings]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 p-8 rounded-lg"><ServerCrash className="h-12 w-12 mb-4" /><p className="text-lg font-semibold">{error}</p></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Demo Bookings</CardTitle>
          <CardDescription>A log of all scheduled product demos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booked By</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Demo Date & Time</TableHead>
                <TableHead>Status</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBookings.map(booking => (
                 <TableRow key={booking.id} className={isPending && actionBooking?.id === booking.id ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{booking.name}</TableCell>
                  <TableCell>{booking.email}</TableCell>
                  <TableCell>
                    {format(new Date(booking.date), 'PPP')} at {format(new Date(`1970-01-01T${booking.startTime}`), 'p')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      booking.status === 'scheduled' ? 'default' :
                      booking.status === 'denied' ? 'destructive' :
                      'secondary'
                    } className="capitalize">{booking.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {booking.status === 'pending' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => handleAction(booking, 'approve')} className="text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction(booking, 'deny')} className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Deny
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No bookings found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { confirmAction?.fn(); setConfirmOpen(false); }} className={confirmAction?.text === 'Deny' ? "bg-destructive hover:bg-destructive/90" : ""}>
                    {confirmAction?.text}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </>
  );
}
