
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PostComment, UserProfile } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../ui/button";
import { useState } from "react";
import { Textarea } from "../ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type PostCommentItemProps = {
  comment: PostComment;
  author?: UserProfile;
  children?: React.ReactNode;
  onReply: (content: string, parentId: string) => void;
  isChild?: boolean;
};

export default function PostCommentItem({ comment, author, children, onReply, isChild = false }: PostCommentItemProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    await onReply(replyContent, comment.id);
    setSubmitting(false);
    setReplyContent('');
    setShowReplyForm(false);
  };
    
  return (
    <div className="flex flex-col">
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={author?.avatarUrl ?? undefined} />
                <AvatarFallback>{author?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-secondary rounded-lg px-3 py-2">
                <p className="font-semibold text-sm">{author?.displayName ?? '...'}</p>
                <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 px-2">
                <span>{formatDistanceToNow(new Date(comment.createdAt as Date), { addSuffix: true })}</span>
                {!isChild && user && (
                    <>
                        ·
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowReplyForm(!showReplyForm)}>
                            Reply
                        </Button>
                    </>
                )}
                </div>
            </div>
        </div>

        {showReplyForm && (
             <div className="ml-11 mt-2">
                 <Textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Replying to ${author?.displayName || '...'}`}
                    rows={2}
                    className="bg-background"
                />
                 <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleReplySubmit} disabled={isSubmitting || !replyContent.trim()}>
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                        Submit Reply
                    </Button>
                 </div>
             </div>
        )}
        
        {children}
    </div>
  );
}
