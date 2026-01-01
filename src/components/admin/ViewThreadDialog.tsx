'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import ThreadViewClient from '../forum/ThreadViewClient';


type ViewThreadDialogProps = {
  threadId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function ViewThreadDialog({ threadId, isOpen, setIsOpen }: ViewThreadDialogProps) {
  if (!threadId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Viewing Thread</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <ThreadViewClient threadId={threadId} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
