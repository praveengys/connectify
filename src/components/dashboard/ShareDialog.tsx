
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sharePost } from '@/lib/firebase/client-actions';
import { useFirebase } from '@/firebase/client-provider';
import { useAuth } from '@/hooks/use-auth';

type ShareDialogProps = {
  postId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function ShareDialog({ postId, isOpen, setIsOpen }: ShareDialogProps) {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const postUrl = `${window.location.origin}/post/${postId}`;

  const handleShare = () => {
    if (!user) return;
    sharePost(firestore, postId, user.uid);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(postUrl).then(
      () => {
        setCopied(true);
        toast({ title: 'Success', description: 'Link copied to clipboard!' });
        handleShare();
        setTimeout(() => {
          setCopied(false);
          setIsOpen(false);
        }, 2000);
      },
      (err) => {
        toast({
          title: 'Error',
          description: 'Could not copy link to clipboard.',
          variant: 'destructive',
        });
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>
            Copy the link below to share this post with others.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input id="link" defaultValue={postUrl} readOnly />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleCopy}>
            {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
