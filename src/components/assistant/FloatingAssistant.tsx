
'use client';

import { useState, useEffect, useRef, useCallback, type MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot } from 'lucide-react';
import CommunityAssistantWidget from '@/components/dashboard/CommunityAssistantWidget';

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLButtonElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    if (dragRef.current) {
      setIsDragging(true);
      const rect = dragRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      // Prevent text selection while dragging
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (isDragging && dragRef.current) {
        // We calculate position relative to the initial bottom-right corner
        const newX = e.clientX - window.innerWidth + dragRef.current.offsetWidth - offsetRef.current.x;
        const newY = e.clientY - window.innerHeight + dragRef.current.offsetHeight - offsetRef.current.y;
        
        setPosition({ x: newX, y: newY });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  return (
    <div 
        className="fixed bottom-6 right-6 z-50"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={dragRef}
            onMouseDown={handleMouseDown}
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg cursor-grab active:cursor-grabbing"
          >
            <Bot size={24} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-80 md:w-96 p-0 rounded-xl shadow-2xl mr-2 mb-2"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommunityAssistantWidget />
        </PopoverContent>
      </Popover>
    </div>
  );
}
