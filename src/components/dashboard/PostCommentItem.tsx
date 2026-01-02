
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PostComment, UserProfile } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../ui/button";

type PostCommentItemProps = {
  comment: PostComment;
  author?: UserProfile;
};

export default function PostCommentItem({ comment, author }: PostCommentItemProps) {
  return (
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
          ·
          <Button variant="link" size="sm" className="p-0 h-auto text-xs">Reply</Button>
        </div>
      </div>
    </div>
  );
}
