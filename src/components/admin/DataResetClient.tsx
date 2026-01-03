
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { clearDatabase } from '@/lib/firebase/client-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DataResetClient() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  async function handleDataReset() {
    setIsSubmitting(true);
    try {
      const result = await clearDatabase();
      if (result.success) {
        toast({
          title: 'Database Cleared',
          description: `Deleted ${result.deletedUsers} users and ${result.deletedDocs} documents.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Operation Failed',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <Card className="max-w-2xl border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            Reset Community Data
        </CardTitle>
        <CardDescription>
          This is a highly destructive action. It will permanently delete users, posts, groups, discussions, and other content from the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">The following user accounts and their associated Firestore profiles will **not** be deleted:</p>
        <ul className="list-disc pl-5 mt-2 text-sm font-mono bg-muted p-3 rounded-md">
            <li>tnbit@gmail.com</li>
            <li>tnbit2@gmail.com</li>
            <li>pgy@gmail.com</li>
            <li>pg1@gmail.com</li>
        </ul>
        <p className="text-sm mt-4">All other Firebase Authentication users and all documents in major collections (users, posts, groups, threads, etc.) will be wiped. **This cannot be undone.**</p>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Reset All Community Data
        </Button>
      </CardFooter>
    </Card>

    <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action is permanent and cannot be reversed. You are about to delete all community data. Please confirm you want to proceed.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDataReset} className="bg-destructive hover:bg-destructive/90">
                    I understand, delete the data
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </>
  );
}
