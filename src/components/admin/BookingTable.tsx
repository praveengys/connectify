

'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { DemoBooking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ServerCrash } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingTable() {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const sortedBookings = useMemo(() => {
    return bookings.sort((a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime());
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBookings.map(booking => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.name}</TableCell>
                  <TableCell>{booking.email}</TableCell>
                  <TableCell>
                    {format(new Date(booking.date), 'PPP')} at {format(new Date(`1970-01-01T${booking.startTime}`), 'p')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={booking.status === 'scheduled' ? 'default' : 'secondary'} className="capitalize">
                        {booking.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No bookings found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
