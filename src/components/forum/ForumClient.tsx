
'use client';

import { useEffect, useState } from 'react';
import type { Category, Thread, UserProfile, Forum } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, MessageSquare, PlusCircle, ServerCrash } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import CreateForumForm from './CreateForumForm';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getUserProfile } from '@/lib/firebase/client-actions';
import { useFirebase } from '@/firebase/client-provider';


export default function ForumClient() {
  const { firestore } = useFirebase();
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
    if (authLoading) return;
    if (!user) {
        setLoading(false);
        // No need to set an error, the UI will guide the user to log in.
        return;
    }
    
    setLoading(true);

    const unsubscribes: (() => void)[] = [];

    // Fetch Threads and Authors
    const threadsQuery = query(collection(firestore, 'threads'), orderBy('createdAt', 'desc'));
    const threadsUnsubscribe = onSnapshot(threadsQuery, async (snapshot) => {
        const threadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() ?? new Date() } as Thread));
        setThreads(threadsData);

        const authorIds = [...new Set(threadsData.map(t => t.authorId).filter(Boolean))];
        const newAuthorIds = authorIds.filter(id => !authors[id]);
        
        if (newAuthorIds.length > 0) {
            const authorPromises = newAuthorIds.map(id => getUserProfile(id));
            const authorResults = await Promise.all(authorPromises);
            setAuthors(prev => {
                const newAuthors = { ...prev };
                authorResults.forEach(author => {
                    if (author) newAuthors[author.uid] = author;
                });
                return newAuthors;
            });
        }
    }, err => {
        console.error("Error fetching threads:", err);
        setError("Could not load discussions.");
    });
    unsubscribes.push(threadsUnsubscribe);

    // Fetch Forums
    const forumsQuery = query(collection(firestore, 'forums'), orderBy('createdAt', 'desc'));
    const forumsUnsubscribe = onSnapshot(forumsQuery, (snapshot) => {
        setForums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() ?? new Date() } as Forum)));
    }, err => {
        console.error("Error fetching forums:", err);
        setError("Could not load forums.");
    });
    unsubscribes.push(forumsUnsubscribe);

    // Fetch Categories
    const categoriesQuery = query(collection(firestore, 'categories'), orderBy('name', 'asc'));
    const categoriesUnsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, err => {
        console.error("Error fetching categories:", err);
        setError("Could not load categories.");
    });
    unsubscribes.push(categoriesUnsubscribe);
    
    // Combine loading states
    Promise.all([
      new Promise(resolve => onSnapshot(threadsQuery, resolve)),
      new Promise(resolve => onSnapshot(forumsQuery, resolve)),
      new Promise(resolve => onSnapshot(categoriesQuery, resolve)),
    ]).then(() => setLoading(false)).catch(() => setLoading(false));

    return () => unsubscribes.forEach(unsub => unsub());

  }, [authLoading, user, firestore, authors]);

  const handleForumCreated = (newForum: Forum) => {
    // The real-time listener will add the new forum, so we just need to close the dialog.
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
      <main className="flex-grow">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold">Community Forum</h1>
              <p className="text-muted-foreground mt-2">
              Ask questions, share knowledge, and connect with peers.
              </p>
          </div>
          {user && (
              <Button onClick={() => router.push('/forum/threads/new')} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Discussion
              </Button>
          )}
        </div>
        
        {!user && (
             <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
                  <p className="mt-1 text-sm">You must be logged in to view the community forum.</p>
                  <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
              </div>
        )}

        {user && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
                <h2 className="text-2xl font-bold mb-4">Recent Discussions</h2>
                <div className="space-y-4">
                {threads.map(thread => (
                    <Card key={thread.id} className="card-hover">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex flex-col items-center text-center w-20 shrink-0">
                        <p className="font-bold text-2xl">{thread.replyCount ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Replies</p>
                        </div>

                        <div className="flex-grow">
                        <Link href={`/forum/threads/${thread.id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary leading-tight">{thread.title}</h3>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={authors[thread.authorId]?.avatarUrl ?? undefined} />
                                <AvatarFallback>{authors[thread.authorId]?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                            </Avatar>
                            <span>{authors[thread.authorId]?.displayName ?? '...'}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline">{formatDistanceToNow(thread.createdAt, { addSuffix: true })}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {thread.tags?.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                        </div>
                        
                        <Button variant="ghost" size="icon" className="shrink-0" asChild>
                            <Link href={`/forum/threads/${thread.id}`}>
                                <MessageSquare className="h-5 w-5" />
                            </Link>
                        </Button>
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

            <div className="lg:col-span-1 space-y-6">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg">Forums</CardTitle>
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
                        <ul className="space-y-1">
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
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    {categories.length > 0 ? (
                        <ul className="space-y-1">
                            {categories.map(category => (
                            <li key={category.id}>
                                <div className="p-3 rounded-md hover:bg-accent transition-colors">
                                    <p className="font-semibold">{category.name}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
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
        )}
      </div>
    </main>
    <footer className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
