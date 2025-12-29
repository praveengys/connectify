
'use client';

import type { ChatMessage, UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  message: ChatMessage;
  currentUser: UserProfile;
};

export default function ChatMessageItem({ message, currentUser }: ChatMessageProps) {
  const isCurrentUser = message.senderId === currentUser.uid;

  // Make sure senderName and senderAvatar are available, provide defaults if not.
  const senderName = message.senderProfile?.displayName ?? 'User';
  const senderAvatar = message.senderProfile?.avatarUrl ?? undefined;

  return (
    <div className={cn(
      "flex items-start gap-3",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{senderName?.charAt(0).toUpperCase() ?? '?'}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "flex flex-col max-w-xs md:max-w-md",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-lg",
          isCurrentUser 
            ? "bg-primary text-primary-foreground rounded-br-none" 
            : "bg-secondary text-secondary-foreground rounded-bl-none"
        )}>
          {message.text && <p className="text-sm">{message.text}</p>}
        </div>
        <div className="text-xs text-muted-foreground mt-1 px-1">
          {!isCurrentUser && <span className="font-semibold mr-2">{senderName}</span>}
          <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
        </div>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser.avatarUrl ?? undefined} />
          <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() ?? '?'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
