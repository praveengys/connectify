'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Category, Thread, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, MessageSquare, ServerCrash } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { getUserProfile } from '@/lib/firebase/firestore';
import { Badge } from '../ui/badge';

export default function ForumClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { firestore } = initializeFirebase();
        
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoriesData);

        // Fetch recent threads
        const threadsQuery = query(collection(firestore, 'threads'), orderBy('createdAt', 'desc'), limit(10));
        const threadsSnapshot = await getDocs(threadsQuery);
        const threadsData = threadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          latestReplyAt: doc.data().latestReplyAt?.toDate(),
        } as Thread));
        setThreads(threadsData);

        // Fetch authors for threads
        const authorIds = [...new Set(threadsData.map(t => t.authorId))];
        const authorPromises = authorIds.map(id => getUserProfile(id));
        const authorResults = await Promise.all(authorPromises);
        const authorMap: Record<string, UserProfile> = {};
        authorResults.forEach((author, index) => {
          if (author) {
            authorMap[authorIds[index]] = author;
          }
        });
        setAuthors(authorMap);

      } catch (e: any) {
        console.error("Error fetching forum data: ", e);
        setError("Could not load the forum. Please try again later.");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-8">
          <ServerCrash className="h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Error Loading Forum</p>
          <p className="text-sm text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Community Forum</h1>
        <p className="text-muted-foreground mt-2">
          Ask questions, share knowledge, and connect with peers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Main Content: Recent Threads */}
        <div className="md:col-span-3">
          <h2 className="text-2xl font-bold mb-4">Recent Discussions</h2>
          <div className="space-y-4">
            {threads.map(thread => (
              <Card key={thread.id} className="hover:bg-card/90">
                <CardContent className="p-4 flex items-start gap-4">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={authors[thread.authorId]?.avatarUrl ?? undefined} />
                    <AvatarFallback>{authors[thread.authorId]?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <Link href={`/forum/threads/${thread.id}`}>
                      <h3 className="font-semibold text-lg hover:text-primary">{thread.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Started by {authors[thread.authorId]?.displayName ?? '...'} · {formatDistanceToNow(thread.createdAt, { addSuffix: true })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {thread.tags?.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center w-20 shrink-0">
                    <p className="font-bold text-xl">{thread.replyCount}</p>
                    <p className="text-xs text-muted-foreground">Replies</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {threads.length === 0 && (
                 <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <MessageSquare className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No discussions yet</h3>
                    <p className="mt-1 text-sm">Be the first to start a conversation!</p>
                </div>
            )}
          </div>
        </div>

        {/* Sidebar: Categories */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
                {categories.length > 0 ? (
                    <ul className="space-y-2">
                        {categories.map(category => (
                        <li key={category.id}>
                            <Link href={`/forum/category/${category.slug}`}>
                            <div className="p-3 rounded-md hover:bg-secondary">
                                <p className="font-semibold">{category.name}</p>
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                            </div>
                            </Link>
                        </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No categories available.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
