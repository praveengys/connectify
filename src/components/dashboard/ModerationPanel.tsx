'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { approveForum, getForumsForReview, rejectForum } from '@/lib/firebase/firestore';
import type { Forum } from '@/lib/types';
import { Loader2, Check, X, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ModerationPanel() {
  const [pendingForums, setPendingForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchPendingForums = async () => {
    setLoading(true);
    try {
      const forums = await getForumsForReview();
      setPendingForums(forums);
    } catch (error: any) {
      toast({
        title: 'Error fetching queue',
        description: error.message || 'Could not load forums for review.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingForums();
  }, []);

  const handleApprove = async (forumId: string) => {
    setActionLoading(prev => ({ ...prev, [forumId]: true }));
    try {
      await approveForum(forumId);
      toast({
        title: 'Forum Approved',
        description: 'The forum is now active and public.',
      });
      // Refresh the list
      fetchPendingForums();
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setActionLoading(prev => ({ ...prev, [forumId]: false }));
  };

  const handleReject = async (forumId: string) => {
    setActionLoading(prev => ({ ...prev, [forumId]: true }));
    try {
      await rejectForum(forumId);
      toast({
        title: 'Forum Rejected',
        description: 'The forum submission has been removed.',
        variant: 'destructive'
      });
      // Refresh the list
      fetchPendingForums();
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
     setActionLoading(prev => ({ ...prev, [forumId]: false }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle>Moderation Panel</CardTitle>
        </div>
        <CardDescription>Review and approve new user-submitted forums.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pendingForums.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p className="font-semibold">The approval queue is empty.</p>
            <p className="text-sm">No new forums are awaiting review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingForums.map(forum => (
              <div key={forum.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{forum.name}</h4>
                  <p className="text-sm text-muted-foreground">{forum.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {formatDistanceToNow(forum.createdAt as Date, { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(forum.id)}
                    disabled={actionLoading[forum.id]}
                  >
                    {actionLoading[forum.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    <span className="ml-2 hidden md:inline">Reject</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(forum.id)}
                    disabled={actionLoading[forum.id]}
                  >
                    {actionLoading[forum.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                     <span className="ml-2 hidden md:inline">Approve</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
