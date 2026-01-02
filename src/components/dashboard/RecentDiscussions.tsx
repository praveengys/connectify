'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Thread } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/button';

export default function RecentDiscussions() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { firestore } = initializeFirebase();
        const threadsRef = collection(firestore, 'threads');
        const q = query(threadsRef, orderBy('createdAt', 'desc'), limit(5));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const threadsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
            } as Thread));
            setThreads(threadsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching recent threads:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Recent Discussions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading && (
                    <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
                {!loading && threads.map(thread => (
                    <Link href={`/forum/threads/${thread.id}`} key={thread.id} className="block hover:bg-accent rounded-lg p-2 -m-2">
                        <div>
                            <p className="font-semibold text-sm leading-tight line-clamp-2">{thread.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {thread.replyCount} replies · {formatDistanceToNow(thread.createdAt, { addSuffix: true })}
                            </p>
                        </div>
                    </Link>
                ))}
                {!loading && threads.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">No discussions yet.</p>
                )}
                {!loading && (
                    <Button variant="outline" className="w-full" asChild>
                       <Link href="/forum">
                           See All Discussions
                       </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
