
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/hooks/use-auth";
import { Image, MapPin, Video, Mic, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createPost } from "@/lib/firebase/firestore";
import { Card, CardContent } from "../ui/card";

export default function PostCreator({ user }: { user: UserProfile }) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  const handleCreatePost = async () => {
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
        await createPost(user.uid, content, 'active');
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
            placeholder={`Share what's on your mind, ${user.displayName.split(' ')[0]}...`}
            className="flex-grow border-none focus-visible:ring-0 bg-transparent p-0" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
          />
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex gap-2 text-muted-foreground">
                <Button variant="ghost" size="icon"><Image /></Button>
                <Button variant="ghost" size="icon"><Video /></Button>
                <Button variant="ghost" size="icon"><Mic /></Button>
                <Button variant="ghost" size="icon"><MapPin /></Button>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleCreatePost} disabled={isPosting || !content.trim()}>
                    {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
