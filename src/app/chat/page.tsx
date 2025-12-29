'use client';

import ChatLayout from '@/components/chat/ChatLayout';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <ChatLayout>
        <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground">
            <MessageSquare size={64} className="mb-4" />
            <h2 className="text-xl font-semibold">Welcome to Chat</h2>
            <p>Select a group from the list to start messaging.</p>
        </div>
    </ChatLayout>
  );
}
