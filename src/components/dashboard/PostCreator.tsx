
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/hooks/use-auth";
import { Image, MapPin, Video, Mic, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createPost } from "@/lib/firebase/firestore";

export default function PostCreator({ user }: { user: UserProfile }) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  const handlePost = async () => {
    if (!content.trim()) {
        toast({
            title: "Post is empty",
            description: "You can't create an empty post.",
            variant: "destructive"
        });
        return;
    }

    setIsPosting(true);
    try {
        await createPost(user.uid, content);
        setContent('');
        toast({
            title: "Posted!",
            description: "Your post is now live on the feed.",
        });
    } catch (error: any) {
        toast({
            title: "Error",
            description: `Could not create post: ${error.message}`,
            variant: "destructive"
        });
    } finally {
        setIsPosting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src={user.avatarUrl || ''} />
            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <Textarea 
            placeholder="What's on your mind?" 
            className="flex-grow border-none focus-visible:ring-0" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
            <div className="flex gap-4 text-muted-foreground">
                <Image className="cursor-pointer hover:text-primary" />
                <Video className="cursor-pointer hover:text-primary" />
                <Mic className="cursor-pointer hover:text-primary" />
                <MapPin className="cursor-pointer hover:text-primary" />
            </div>
            <div className="flex gap-2">
                <Button variant="outline" disabled={isPosting}>Draft</Button>
                <Button onClick={handlePost} disabled={isPosting || !content.trim()}>
                    {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

    