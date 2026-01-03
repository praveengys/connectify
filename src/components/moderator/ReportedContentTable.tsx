
'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import type { Report, UserProfile, Thread, Reply } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2, ServerCrash, Eye, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getUserProfile } from '@/lib/firebase/client-actions';
import { updateReportStatus, deleteThread, deleteReply } from '@/lib/firebase/server-actions';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import ViewThreadDialog from '../admin/ViewThreadDialog';
import { useFirebase } from '@/firebase/client-provider';

type AugmentedReport = Report & {
  reporter?: UserProfile;
  contentAuthor?: UserProfile;
  content?: Thread | Reply;
};

export default function ReportedContentTable() {
  const { firestore } = useFirebase();
  const [reports, setReports] = useState<AugmentedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', description: '', onConfirm: () => {} });
  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null);


  useEffect(() => {
    const reportsRef = collection(firestore, 'reports');
    const q = query(reportsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reportsData: Report[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() ?? new Date() } as Report));
      
      const augmentedReports = await Promise.all(reportsData.map(async (report) => {
          let content: Thread | Reply | null = null;
          let contentAuthor: UserProfile | null = null;
          const reporter = await getUserProfile(report.reporterId);
          
          if (report.contentType === 'thread') {
              const threadRef = doc(firestore, 'threads', report.contentId);
              const threadSnap = await getDoc(threadRef);
              if (threadSnap.exists()) {
                  content = { id: threadSnap.id, ...threadSnap.data() } as Thread;
                  contentAuthor = await getUserProfile(content.authorId);
              }
          } else if (report.contentType === 'reply' && report.threadId) {
              const replyRef = doc(firestore, 'threads', report.threadId, 'replies', report.contentId);
              const replySnap = await getDoc(replyRef);
              if (replySnap.exists()) {
                  content = { id: replySnap.id, ...replySnap.data() } as Reply;
                  contentAuthor = await getUserProfile(content.authorId);
              }
          }

          return { ...report, reporter, content, contentAuthor };
      }));

      setReports(augmentedReports.filter(r => r.content)); // Only show reports with valid content
      setLoading(false);
    }, (err) => {
      console.error("Error fetching reports:", err);
      setError("Failed to load report data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleAction = (title: string, description: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, description, onConfirm });
  };
  
  const performAction = (actionPromise: Promise<any>, successMessage: string) => {
      startTransition(async () => {
          try {
              await actionPromise;
              toast({ title: 'Success', description: successMessage });
          } catch (error: any) {
              toast({ title: 'Error', description: error.message, variant: 'destructive' });
          }
      });
  };

  const handleDismissReport = (reportId: string) => {
      handleAction(
          "Dismiss Report?",
          "This will mark the report as resolved with no action taken. The content will remain visible.",
          () => performAction(updateReportStatus(reportId, 'resolved'), 'Report dismissed.')
      );
  };
  
  const handleDeleteContent = (report: AugmentedReport) => {
      if (!report.content) return;
      handleAction(
          `Delete ${report.contentType}?`,
          "This action is permanent. The content will be removed and the report will be marked as resolved.",
          () => {
              let deletePromise;
              if (report.contentType === 'thread') {
                  deletePromise = deleteThread(report.contentId);
              } else if (report.contentType === 'reply' && report.threadId) {
                  deletePromise = deleteReply(report.threadId, report.contentId);
              } else {
                  return;
              }
              performAction(Promise.all([deletePromise, updateReportStatus(report.id, 'resolved')]), 'Content deleted and report resolved.');
          }
      );
  };

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
          <CardTitle>Reported Content</CardTitle>
          <CardDescription>Review and take action on content flagged by the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id} className={isPending ? 'opacity-50' : ''}>
                  <TableCell className="max-w-xs">
                     <p className="font-medium truncate">{report.contentType === 'thread' ? (report.content as Thread)?.title : (report.content as Reply)?.body}</p>
                     <p className="text-xs text-muted-foreground">Type: {report.contentType}</p>
                  </TableCell>
                  <TableCell>
                      <p className="font-medium capitalize">{report.reason.replace('_', ' ')}</p>
                      {report.comment && <p className="text-xs text-muted-foreground truncate">"{report.comment}"</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarImage src={report.reporter?.avatarUrl ?? undefined} /><AvatarFallback>{report.reporter?.displayName?.charAt(0)}</AvatarFallback></Avatar>
                        <span>{report.reporter?.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={report.status === 'open' ? 'destructive' : 'secondary'}>{report.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setViewingThreadId(report.threadId || (report.contentType === 'thread' ? report.contentId : null))}><Eye className="mr-2 h-4 w-4" /> View Context</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleDismissReport(report.id)}><Check className="mr-2 h-4 w-4" /> Dismiss Report</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteContent(report)}><Trash2 className="mr-2 h-4 w-4" /> Delete Content</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No reports found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        
        {viewingThreadId && <ViewThreadDialog threadId={viewingThreadId} isOpen={!!viewingThreadId} setIsOpen={() => setViewingThreadId(null)} />}

        <AlertDialog open={confirmState.isOpen} onOpenChange={(open) => setConfirmState(prev => ({...prev, isOpen: open}))}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{confirmState.title}</AlertDialogTitle>
                    <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { confirmState.onConfirm(); setConfirmState({ isOpen: false, title: '', description: '', onConfirm: () => {} }); }} className="bg-destructive hover:bg-destructive/90">Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
