
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type ChatInputProps = {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
};

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isSending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || isSending) return;

    setSending(true);
    try {
      await onSendMessage(trimmedText);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? "Chat is locked" : "Type a message..."}
        autoComplete="off"
        disabled={isSending || disabled}
      />
      <Button type="submit" size="icon" disabled={isSending || !text.trim() || disabled}>
        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
