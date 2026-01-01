
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, MessageSquare } from 'lucide-react';
import CommunityAssistantWidget from '@/components/dashboard/CommunityAssistantWidget';

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg"
          >
            <Bot size={24} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-80 md:w-96 p-0 rounded-xl shadow-2xl mr-2 mb-2"
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
        >
          <CommunityAssistantWidget />
        </PopoverContent>
      </Popover>
    </div>
  );
}
