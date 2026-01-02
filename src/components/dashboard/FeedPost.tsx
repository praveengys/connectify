
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MoreHorizontal, MessageSquare, Share2 } from "lucide-react";
import Image from "next/image";
import type { Post } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/hooks/use-auth";
import LikeButton from "./LikeButton";
import { useState } from "react";
import CommentSection from "./CommentSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import ShareDialog from "./ShareDialog";
import { sharePost } from "@/lib/firebase/firestore";

type FeedPostProps = {
    post: Post;
}

const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg)$/i.test(new URL(url).pathname);
}

export default function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  if (!user) return null;

  const handleShare = () => {
    sharePost(post.id, user.uid);
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={post.author?.avatarUrl ?? undefined} />
          <AvatarFallback>{post.author?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="font-semibold">{post.author?.displayName ?? 'Community Member'}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt as Date), { addSuffix: true })}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
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
              <Image src={post.media[0]} alt="Post media" layout="fill" objectFit="cover" />
            )}
          </div>
        )}
      </CardContent>
       <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <CardFooter className="flex justify-between border-t pt-4">
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
    </>
  );
}
