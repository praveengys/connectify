
import ThreadViewClient from '@/components/forum/ThreadViewClient';
import { getThread, getRepliesForThread, getUserProfile } from '@/lib/firebase/firestore';
import type { Reply, Thread, UserProfile } from '@/lib/types';
import { notFound } from 'next/navigation';

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const thread = await getThread(params.threadId);

  if (!thread) {
    notFound();
  }

  // Initial data load. Real-time updates will be handled by the client component.
  const [initialReplies, threadAuthor] = await Promise.all([
    getRepliesForThread(params.threadId),
    getUserProfile(thread.authorId),
  ]);

  // Fetch authors for all replies
  const authorIds = new Set<string>([thread.authorId]);
  initialReplies.forEach(reply => authorIds.add(reply.authorId));

  const authors: Record<string, UserProfile> = {};
  if (threadAuthor) {
    authors[thread.authorId] = threadAuthor;
  }
  
  const authorPromises = Array.from(authorIds)
    .filter(id => !authors[id]) // Only fetch authors we don't have yet
    .map(id => getUserProfile(id));
  
  const authorResults = await Promise.all(authorPromises);
  
  authorResults.forEach((author) => {
    if (author) {
      authors[author.uid] = author;
    }
  });


  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8">
        <ThreadViewClient
          initialThread={thread}
          initialReplies={initialReplies}
          initialAuthors={authors}
        />
      </main>
      <footer className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

    