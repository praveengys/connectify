
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MoreHorizontal, MessageSquare, ThumbsUp, Share2 } from "lucide-react";
import Image from "next/image";

export default function FeedPost() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src="https://picsum.photos/seed/kina/40/40" />
          <AvatarFallback>KR</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="font-semibold">Kina Rally</p>
          <p className="text-sm text-muted-foreground">03 june at 08.02 AM</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
            <Image src="https://picsum.photos/seed/travel/600/338" alt="Travel post" layout="fill" objectFit="cover" data-ai-hint="woman working on laptop with ocean view" />
        </div>
        <p className="text-muted-foreground">
          Hello from Bali! I'm a traveling content creator and I'm very excited to join the community!
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm"><ThumbsUp className="mr-2"/> Like</Button>
            <Button variant="ghost" size="sm"><MessageSquare className="mr-2"/> Comment</Button>
            <Button variant="ghost" size="sm"><Share2 className="mr-2"/> Share</Button>
      </CardFooter>
    </Card>
  );
}
