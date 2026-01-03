
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageSquare, Share2, Trash2 } from "lucide-react";
import Image from "next/image";
import type { Post } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/hooks/use-auth";
import LikeButton from "./LikeButton";
import { useState } from "react";
import CommentSection from "./CommentSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import ShareDialog from "./ShareDialog";
import { sharePost } from "@/lib/firebase/client-actions";
import { deletePost } from "@/lib/firebase/server-actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
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

type FeedPostProps = {
    post: Post;
}

const isVideo = (url: string) => {
    try {
        return /\.(mp4|webm|ogg)$/i.test(new URL(url).pathname);
    } catch (e) {
        return false;
    }
}

export default function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  
  if (!user) return null;

  const handleShare = () => {
    sharePost(post.id, user.uid);
  }
  
  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      toast({
        title: 'Post Deleted',
        description: 'Your post has been successfully removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Could not delete post: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const author = post.author;
  const displayAuthor = author;
  const displayDate = post.createdAt;


  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={displayAuthor?.avatarUrl ?? undefined} />
          <AvatarFallback>{displayAuthor?.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="font-semibold">{displayAuthor?.displayName ?? 'Community Member'}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(displayDate as Date), { addSuffix: true })}
          </p>
        </div>
        {user.uid === post.authorId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </CardHeader>
      <CardContent>
        {post.content && (
            <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                {post.content}
            </p>
        )}
        {post.media && post.media.length > 0 && (
          <div className="relative aspect-video rounded-lg overflow-hidden border">
            {isVideo(post.media[0]) ? (
              <video src={post.media[0]} controls className="w-full h-full bg-black" />
            ) : (
              <Image src={post.media[0]} alt="Post media" fill className="object-cover" />
            )}
          </div>
        )}
      </CardContent>
       <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <CardFooter className="flex justify-around border-t pt-4">
              <LikeButton postId={post.id} initialLikes={post.likesCount} initialIsLiked={!!post.isLiked} />
              <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm"><MessageSquare className="mr-2"/> Comment ({post.commentsCount})</Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="sm" onClick={() => setIsShareOpen(true)}><Share2 className="mr-2"/> Share</Button>
        </CardFooter>
        <CollapsibleContent>
            <CommentSection postId={post.id} />
        </CollapsibleContent>
      </Collapsible>
    </Card>
     <ShareDialog 
        postId={post.id}
        isOpen={isShareOpen}
        setIsOpen={setIsShareOpen}
        onShare={handleShare}
      />
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
