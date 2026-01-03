
'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Thread, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Loader2, ServerCrash, Eye, Lock, Unlock, Pin, PinOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getUserProfile, toggleThreadLock, toggleThreadPin } from '@/lib/firebase/client-actions';
import { deleteThread } from '@/lib/firebase/server-actions';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import ViewThreadDialog from '../admin/ViewThreadDialog';
import { useFirebase } from '@/firebase/client-provider';

export default function ModeratorDiscussionTable() {
  const { firestore } = useFirebase();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [actionThread, setActionThread] = useState<Thread | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ fn: () => void; text: string } | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');
  const [viewingThread, setViewingThread] = useState<Thread | null>(null);

  useEffect(() => {
    const threadsRef = collection(firestore, 'threads');
    const q = query(threadsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      async (snapshot) => {
        const threadsData: Thread[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        } as Thread));
        setThreads(threadsData);

        const authorIds = [...new Set(threadsData.map(t => t.authorId))];
        
        const newAuthorIds = authorIds.filter(id => id && !authors[id]);
        if (newAuthorIds.length > 0) {
            const fetchedAuthors = await Promise.all(
                newAuthorIds.map(id => getUserProfile(firestore, id))
            );
            setAuthors(prev => {
                const updatedAuthors = { ...prev };
                fetchedAuthors.forEach(author => {
                    if (author) updatedAuthors[author.uid] = author;
                });
                return updatedAuthors;
            });
        }
        
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching threads:", err);
        setError("Failed to load discussion data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, authors]);
  
  const handleAction = (thread: Thread, action: 'lock' | 'unlock' | 'pin' | 'unpin' | 'delete') => {
      setActionThread(thread);
      let title = '', description = '', actionFn: (() => void) | null = null, buttonText = 'Confirm';

      switch(action) {
          case 'lock':
              title = "Lock Thread?"; description = "This will prevent new replies.";
              actionFn = () => performAction(thread.id, toggleThreadLock(firestore, thread.id, true), 'Thread locked.');
              buttonText = "Lock Thread"; break;
          case 'unlock':
              title = "Unlock Thread?"; description = "This will allow new replies.";
              actionFn = () => performAction(thread.id, toggleThreadLock(firestore, thread.id, false), 'Thread unlocked.');
              buttonText = "Unlock Thread"; break;
          case 'pin':
              title = "Pin Thread?"; description = "This will keep the thread at the top of lists.";
              actionFn = () => performAction(thread.id, toggleThreadPin(firestore, thread.id, true), 'Thread pinned.');
              buttonText = "Pin Thread"; break;
          case 'unpin':
              title = "Unpin Thread?"; description = "This will remove the thread from the top of lists.";
              actionFn = () => performAction(thread.id, toggleThreadPin(firestore, thread.id, false), 'Thread unpinned.');
              buttonText = "Unpin Thread"; break;
          case 'delete':
              title = "Delete Thread?"; description = "This is permanent and cannot be undone.";
              actionFn = () => performAction(thread.id, deleteThread(thread.id), 'Thread deleted.');
              buttonText = "Delete Thread"; break;
      }

      setConfirmTitle(title);
      setConfirmDescription(description);
      setConfirmAction({ fn: actionFn!, text: buttonText });
      setConfirmOpen(true);
  }

  const performAction = (threadId: string, actionPromise: Promise<any>, successMessage: string) => {
      startTransition(async () => {
          try {
              await actionPromise;
              toast({ title: 'Success', description: successMessage });
          } catch (error: any) {
              toast({ title: 'Error', description: error.message, variant: 'destructive' });
          }
      });
  };

  const filteredThreads = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return threads.filter(thread =>
      thread.title.toLowerCase().includes(lowercasedTerm) ||
      authors[thread.authorId]?.displayName.toLowerCase().includes(lowercasedTerm)
    );
  }, [threads, searchTerm, authors]);

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
          <CardTitle>All Discussions</CardTitle>
          <CardDescription>Manage all threads in the community.</CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by title or author" className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thread</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredThreads.map(thread => {
                const author = authors[thread.authorId];
                return (
                <TableRow key={thread.id} className={isPending && actionThread?.id === thread.id ? 'opacity-50' : ''}>
                  <TableCell className="font-medium max-w-xs truncate">{thread.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={author?.avatarUrl ?? undefined} />
                            <AvatarFallback>{author?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                        </Avatar>
                        <span>{author?.displayName ?? '...'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{thread.replyCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                        {thread.isLocked && <Badge variant="destructive">Locked</Badge>}
                        {thread.isPinned && <Badge>Pinned</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(thread.createdAt), 'PP')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setViewingThread(thread)}><Eye className="mr-2 h-4 w-4" /> View Thread</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {thread.isLocked 
                            ? <DropdownMenuItem onSelect={() => handleAction(thread, 'unlock')}><Unlock className="mr-2 h-4 w-4" /> Unlock</DropdownMenuItem>
                            : <DropdownMenuItem onSelect={() => handleAction(thread, 'lock')}><Lock className="mr-2 h-4 w-4" /> Lock</DropdownMenuItem>
                        }
                        {thread.isPinned
                            ? <DropdownMenuItem onSelect={() => handleAction(thread, 'unpin')}><PinOff className="mr-2 h-4 w-4" /> Unpin</DropdownMenuItem>
                            : <DropdownMenuItem onSelect={() => handleAction(thread, 'pin')}><Pin className="mr-2 h-4 w-4" /> Pin</DropdownMenuItem>
                        }
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
              {filteredThreads.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No threads found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {viewingThread && (
        <ViewThreadDialog 
            threadId={viewingThread.id} 
            isOpen={!!viewingThread} 
            setIsOpen={(isOpen) => !isOpen && setViewingThread(null)}
        />
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { confirmAction?.fn(); setConfirmOpen(false); }} className={confirmAction?.text.includes('Delete') ? "bg-destructive hover:bg-destructive/90" : ""}>
                    {confirmAction?.text}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </>
  );
}

    