'use client';

import { ReactNode } from "react";
import ChatList from "./ChatList";

interface ChatLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export default function ChatLayout({ children, rightPanel }: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-theme(height.14))] w-full">
      {/* Left panel: Chat list */}
      <aside className="w-full max-w-xs border-r bg-secondary/30">
        <ChatList />
      </aside>

      {/* Middle panel: Chat room content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Right panel: Chat info */}
      {rightPanel && (
        <aside className="hidden lg:block w-full max-w-xs border-l">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
