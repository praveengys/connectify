
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MoreHorizontal, MessageSquare, ThumbsUp, Share2 } from "lucide-react";
import Image from "next/image";
import type { Post, UserProfile } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/hooks/use-auth";
import LikeButton from "./LikeButton";

type FeedPostProps = {
    post: Post;
}

export default function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth();
  if (!user) return null;

  return (
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
            <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image src={post.media[0]} alt="Post media" layout="fill" objectFit="cover" />
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
            <LikeButton postId={post.id} initialLikes={post.likesCount} initialIsLiked={!!post.isLiked} />
            <Button variant="ghost" size="sm"><MessageSquare className="mr-2"/> Comment ({post.commentsCount})</Button>
            <Button variant="ghost" size="sm"><Share2 className="mr-2"/> Share</Button>
      </CardFooter>
    </Card>
  );
}

    