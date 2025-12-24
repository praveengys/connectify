import Header from '@/components/Header';
import ThreadViewClient from '@/components/forum/ThreadViewClient';
import { getThread, getRepliesForThread, getUserProfile } from '@/lib/firebase/firestore';
import type { Reply, Thread, UserProfile } from '@/lib/types';
import { notFound } from 'next/navigation';

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const thread = await getThread(params.threadId);

  if (!thread) {
    notFound();
  }

  const [replies, threadAuthor] = await Promise.all([
    getRepliesForThread(params.threadId),
    getUserProfile(thread.authorId),
  ]);

  // Fetch authors for all replies
  const replyAuthorIds = [...new Set(replies.map(r => r.authorId))];
  const replyAuthorPromises = replyAuthorIds.map(id => getUserProfile(id));
  const replyAuthorResults = await Promise.all(replyAuthorPromises);
  const authors: Record<string, UserProfile> = {};
  
  if (threadAuthor) {
    authors[thread.authorId] = threadAuthor;
  }
  
  replyAuthorResults.forEach((author, index) => {
    if (author) {
      authors[replyAuthorIds[index]] = author;
    }
  });


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ThreadViewClient
          initialThread={thread}
          initialReplies={replies}
          initialAuthors={authors}
        />
      </main>
      <footer className="w-full py-6 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
