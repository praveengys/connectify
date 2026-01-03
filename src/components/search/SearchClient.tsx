
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { UserProfile, Thread, Group } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Search, Users, MessageSquare, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useFirebase } from '@/firebase/client-provider';

function SearchResults() {
  const { firestore } = useFirebase();
  const searchParams = useSearchParams();
  const q = searchParams.get('q');

  const [results, setResults] = useState<{ users: UserProfile[]; threads: Thread[]; groups: Group[] }>({
    users: [],
    threads: [],
    groups: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);

      try {
        // NOTE: Firestore does not support native full-text search.
        // These queries perform simple prefix matches and are not efficient for large datasets.
        // For production, a dedicated search service like Algolia or Elasticsearch is recommended.

        // Search Users
        const userQuery = query(
            collection(firestore, 'users'), 
            where('displayName', '>=', q), 
            where('displayName', '<=', q + '\uf8ff'),
            limit(10)
        );
        const userSnapshot = await getDocs(userQuery);
        const users = userSnapshot.docs.map(doc => doc.data() as UserProfile);

        // Search Threads
        const threadQuery = query(
            collection(firestore, 'threads'), 
            where('title', '>=', q), 
            where('title', '<=', q + '\uf8ff'),
            limit(10)
        );
        const threadSnapshot = await getDocs(threadQuery);
        const threads = threadSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Thread));

        // Search Groups
        const groupQuery = query(
            collection(firestore, 'groups'), 
            where('name', '>=', q), 
            where('name', '<=', q + '\uf8ff'),
            limit(10)
        );
        const groupSnapshot = await getDocs(groupQuery);
        const groups = groupSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Group));

        setResults({ users, threads, groups });
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [q, firestore]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const totalResults = results.users.length + results.threads.length + results.groups.length;

  return (
     <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Search Results</h1>
            <p className="text-muted-foreground">Found {totalResults} results for &quot;{q}&quot;</p>
        </div>

        {totalResults === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Search className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No results found</h3>
                <p className="mt-1 text-sm">Try searching for something else.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Users */}
            {results.users.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Members</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {results.users.map(user => (
                            <Link href={`/members/${user.uid}`} key={user.uid} className="block p-2 -m-2 rounded-lg hover:bg-accent">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl ?? undefined} />
                                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.displayName}</p>
                                        <p className="text-sm text-muted-foreground">ID: {user.memberId}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

             {/* Threads */}
            {results.threads.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen /> Discussions</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       {results.threads.map(thread => (
                            <Link href={`/forum/threads/${thread.id}`} key={thread.id} className="block p-2 -m-2 rounded-lg hover:bg-accent">
                                <p className="font-semibold truncate">{thread.title}</p>
                                <p className="text-sm text-muted-foreground">{thread.replyCount} replies · {formatDistanceToNow(new Date(thread.createdAt as Date), { addSuffix: true })}</p>
                            </Link>
                       ))}
                    </CardContent>
                </Card>
            )}

            {/* Groups */}
            {results.groups.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare /> Groups</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       {results.groups.map(group => (
                             <Link href={`/chat/${group.id}`} key={group.id} className="block p-2 -m-2 rounded-lg hover:bg-accent">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                                        <Users className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{group.name}</p>
                                        <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
                                    </div>
                                </div>
                            </Link>
                       ))}
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  )

}

export default function SearchClient() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
