
'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleLikePost } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type LikeButtonProps = {
  postId: string;
  initialLikes: number;
  initialIsLiked: boolean;
};

export default function LikeButton({ postId, initialLikes, initialIsLiked }: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast({ title: 'Please log in to like posts.', variant: 'destructive' });
      return;
    }
    if (isLiking) return;

    setIsLiking(true);

    // Optimistic UI update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      await toggleLikePost(postId, user.uid);
    } catch (error: any) {
      // Revert optimistic UI update on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
      toast({
        title: 'Error',
        description: `Could not update like: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLiking}
      className={cn(isLiked ? 'text-primary' : '')}
    >
      <ThumbsUp className={cn('mr-2', isLiked ? 'fill-current' : '')} />
      Like ({likeCount})
    </Button>
  );
}

    