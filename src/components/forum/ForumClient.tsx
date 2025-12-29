
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where, limit, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Category, Thread, UserProfile, Forum } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, MessageSquare, PlusCircle, ServerCrash } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { getUserProfile } from '@/lib/firebase/firestore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import CreateForumForm from './CreateForumForm';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Header from '../Header';

export default function ForumClient() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateForumOpen, setCreateForumOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();


  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve
    if (!user) {
        setLoading(false);
        // Optionally redirect or show a login prompt
        return;
    }

    setLoading(true);
    const { firestore } = initializeFirebase();

    // Set up listeners for real-time updates
    const forumsQuery = query(
      collection(firestore, 'forums'),
      orderBy('createdAt', 'desc')
    );
    const threadsQuery = query(
        collection(firestore, 'threads'),
        orderBy('createdAt', 'desc'),
        limit(10)
    );
    const categoriesQuery = query(collection(firestore, 'categories'));

    const unsubscribeForums = onSnapshot(forumsQuery, (snapshot) => {
        const forumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Forum));
        setForums(forumsData);
    }, (err) => {
        console.error("Error fetching forums:", err);
        setError("Could not load forums.");
    });

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoriesData);
    });

    const unsubscribeThreads = onSnapshot(threadsQuery, async (snapshot) => {
        const threadsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          latestReplyAt: doc.data().latestReplyAt?.toDate(),
        } as Thread));

        setThreads(threadsData);

        // Fetch authors for the new threads
        const authorIds = [...new Set(threadsData.map(t => t.authorId))];
        if (authorIds.length > 0) {
            const authorPromises = authorIds.map(id => getUserProfile(id));
            const authorResults = await Promise.all(authorPromises);
            const authorMap: Record<string, UserProfile> = {};
            authorResults.forEach((author) => {
              if (author) {
                authorMap[author.uid] = author;
              }
            });
            setAuthors(prev => ({ ...prev, ...authorMap }));
        }
         setLoading(false);
         setError(null);
    }, (err) => {
        console.error("Error fetching threads:", err);
        setError("Could not load discussions.");
        setLoading(false);
    });

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeForums();
      unsubscribeThreads();
      unsubscribeCategories();
    };
  }, [user, authLoading]);

  const handleForumCreated = (newForum: Forum) => {
    // The listener will add the forum, but we can optimistically add it here too
    setForums(prev => [newForum, ...prev]);
    setCreateForumOpen(false);
  };
  
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-8">
                <ServerCrash className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Error Loading Forum</p>
                <p className="text-sm text-center">{error}</p>
                </div>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold">Community Forum</h1>
              <p className="text-muted-foreground mt-2">
              Ask questions, share knowledge, and connect with peers.
              </p>
          </div>
          {user && (
              <Button onClick={() => router.push('/forum/threads/new')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Discussion
              </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold mb-4">Recent Discussions</h2>
            <div className="space-y-4">
              {threads.map(thread => (
                <Card key={thread.id} className="card-hover">
                  <CardContent className="p-4 flex items-start gap-4">
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarImage src={authors[thread.authorId]?.avatarUrl ?? undefined} />
                      <AvatarFallback>{authors[thread.authorId]?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <Link href={`/forum/threads/${thread.id}`}>
                        <h3 className="font-semibold text-lg hover:text-primary">{thread.title}</h3>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{thread.intent}</Badge>
                        <p className="text-sm text-muted-foreground">
                          Started by {authors[thread.authorId]?.displayName ?? '...'} · {formatDistanceToNow(thread.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                          {thread.tags?.map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center w-24 shrink-0">
                      <p className="font-bold text-xl">{thread.replyCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Replies</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push(`/forum/threads/${thread.id}`)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {threads.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <MessageSquare className="mx-auto h-12 w-12" />
                      <h3 className="mt-4 text-lg font-semibold">No discussions yet</h3>
                      <p className="mt-1 text-sm">Be the first to start a conversation!</p>
                  </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Forums</CardTitle>
                {user && (
                  <Dialog open={isCreateForumOpen} onOpenChange={setCreateForumOpen}>
                      <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Create a new Forum</DialogTitle>
                          </DialogHeader>
                          <CreateForumForm onForumCreated={handleForumCreated} />
                      </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                  {forums.length > 0 ? (
                      <ul className="space-y-2">
                          {forums.filter(f => f.visibility === 'public').map(forum => (
                          <li key={forum.id}>
                              <div className="p-3 rounded-md hover:bg-accent transition-colors">
                                  <p className="font-semibold">{forum.name}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{forum.description}</p>
                              </div>
                          </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground">No active forums.</p>
                  )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                  {categories.length > 0 ? (
                      <ul className="space-y-2">
                          {categories.map(category => (
                          <li key={category.id}>
                              <div className="p-3 rounded-md hover:bg-accent transition-colors">
                                  <p className="font-semibold">{category.name}</p>
                                  <p className="text-sm text-muted-foreground">{category.description}</p>
                              </div>
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
    </main>
    <footer className="w-full py-6 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
