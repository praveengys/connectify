
'use client';
import ThreadViewClient from '@/components/forum/ThreadViewClient';
import { useParams } from 'next/navigation';

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8">
        <ThreadViewClient threadId={threadId} />
      </main>
      <footer className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
