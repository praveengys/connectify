
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


const dummyAuthors: Record<string, UserProfile> = {
    '1': { uid: '1', displayName: 'Alex Johnson', username: 'alexj', avatarUrl: 'https://picsum.photos/seed/101/200', bio: '', interests: [], skills: [], languages: [], location: '', currentlyExploring: '', role: 'member', profileVisibility: 'public', emailVerified: true, createdAt: new Date(), updatedAt: new Date(), lastActiveAt: new Date(), profileScore: 0, postCount: 0, commentCount: 0 },
    '2': { uid: '2', displayName: 'Samantha Lee', username: 'samlee', avatarUrl: 'https://picsum.photos/seed/102/200', bio: '', interests: [], skills: [], languages: [], location: '', currentlyExploring: '', role: 'member', profileVisibility: 'public', emailVerified: true, createdAt: new Date(), updatedAt: new Date(), lastActiveAt: new Date(), profileScore: 0, postCount: 0, commentCount: 0 },
    '3': { uid: '3', displayName: 'Michael Chen', username: 'mikec', avatarUrl: 'https://picsum.photos/seed/103/200', bio: '', interests: [], skills: [], languages: [], location: '', currentlyExploring: '', role: 'member', profileVisibility: 'public', emailVerified: true, createdAt: new Date(), updatedAt: new Date(), lastActiveAt: new Date(), profileScore: 0, postCount: 0, commentCount: 0 },
};

const dummyThreads: Thread[] = [
    { id: 't1', title: 'Best practices for state management in Next.js 14?', body: '...', intent: 'question', authorId: '1', categoryId: 'c1', forumId: 'f1', tags: ['react', 'nextjs', 'state-management'], status: 'published', isLocked: false, isPinned: false, replyCount: 12, latestReplyAt: new Date(Date.now() - 3600000), createdAt: new Date(Date.now() - 86400000 * 2) },
    { id: 't2', title: 'Showcase: My new portfolio built with ShadCN UI and Tailwind', body: '...', intent: 'discussion', authorId: '2', categoryId: 'c2', forumId: 'f1', tags: ['showcase', 'design', 'tailwindcss'], status: 'published', isLocked: false, isPinned: false, replyCount: 8, latestReplyAt: new Date(Date.now() - 7200000), createdAt: new Date(Date.now() - 86400000) },
    { id: 't3', title: 'How to deploy a Genkit app to Firebase App Hosting?', body: '...', intent: 'help', authorId: '3', categoryId: 'c3', forumId: 'f2', tags: ['firebase', 'genkit', 'deployment'], status: 'published', isLocked: false, isPinned: false, replyCount: 5, latestReplyAt: new Date(Date.now() - 10800000), createdAt: new Date(Date.now() - 86400000 * 3) },
    { id: 't4', title: 'Announcement: New "Introductions" category added!', body: '...', intent: 'announcement', authorId: '2', categoryId: 'c4', forumId: 'f1', tags: ['community', 'announcement'], status: 'published', isLocked: false, isPinned: true, replyCount: 23, latestReplyAt: new Date(Date.now() - 900000), createdAt: new Date(Date.now() - 86400000 * 5) },
];

const dummyCategories: Category[] = [
    { id: 'c1', name: 'React & Next.js', slug: 'react-nextjs', description: 'Everything about React and the Next.js framework.', threadCount: 34 },
    { id: 'c2', name: 'UI & Design', slug: 'ui-design', description: 'Discussions on UI/UX, CSS, and design systems.', threadCount: 19 },
    { id: 'c3', name: 'Firebase & Genkit', slug: 'firebase-genkit', description: 'All things related to Google Cloud services.', threadCount: 25 },
    { id: 'c4', name: 'General Chat', slug: 'general-chat', description: 'Off-topic conversations and introductions.', threadCount: 52 },
];

const dummyForums: Forum[] = [
    { id: 'f1', name: 'General Development', description: 'A public forum for all developers.', createdBy: '2', visibility: 'public', status: 'active', createdAt: new Date() },
    { id: 'f2', name: 'AI & Machine Learning', description: 'Discuss the latest in AI and ML.', createdBy: '3', visibility: 'public', status: 'active', createdAt: new Date() },
];


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
    // We are now using dummy data.
    setLoading(true);
    setForums(dummyForums);
    setCategories(dummyCategories);
    setThreads(dummyThreads);
    setAuthors(dummyAuthors);
    setLoading(false);
  }, []);

  const handleForumCreated = (newForum: Forum) => {
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
