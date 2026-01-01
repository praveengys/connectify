
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/hooks/use-auth";
import { Image, MapPin, Video, Mic } from "lucide-react";

export default function PostCreator({ user }: { user: UserProfile }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src={user.avatarUrl || ''} />
            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <Textarea placeholder="What's on your mind?" className="flex-grow border-none focus-visible:ring-0" />
        </div>
        <div className="flex justify-between items-center mt-4">
            <div className="flex gap-4 text-muted-foreground">
                <Image className="cursor-pointer hover:text-primary" />
                <Video className="cursor-pointer hover:text-primary" />
                <Mic className="cursor-pointer hover:text-primary" />
                <MapPin className="cursor-pointer hover:text-primary" />
            </div>
            <div className="flex gap-2">
                <Button variant="outline">Draft</Button>
                <Button>Post</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
