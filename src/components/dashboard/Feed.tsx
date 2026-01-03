
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Post, UserProfile } from '@/lib/types';
import FeedPost from './FeedPost';
import { Loader2, ServerCrash } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

async function fetchAndAttachAuthorData(posts: Post[]): Promise<Post[]> {
    const authorIds = new Set<string>();
    posts.forEach(post => {
        authorIds.add(post.authorId);
    });

    const uniqueAuthorIds = Array.from(authorIds);
    if (uniqueAuthorIds.length === 0) return posts;

    const authorProfiles = new Map<string, Pick<UserProfile, 'displayName' | 'avatarUrl' | 'username'>>();
    const authorDocs = await Promise.all(
        uniqueAuthorIds.map(id => getDoc(doc(initializeFirebase().firestore, 'users', id)))
    );

    authorDocs.forEach(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            authorProfiles.set(docSnap.id, {
                displayName: data.displayName,
                avatarUrl: data.avatarUrl,
                username: data.username
            });
        }
    });

    return posts.map(post => ({
        ...post,
        author: authorProfiles.get(post.authorId)
    }));
}

const FeedSkeleton = () => (
    <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 border rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                    </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-[80%] mb-4" />
                <Skeleton className="aspect-video w-full rounded-lg" />
            </div>
        ))}
    </div>
);

export default function Feed() {
    const { user, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setLoading(false);
            return;
        }

        const { firestore } = initializeFirebase();
        const postsRef = collection(firestore, 'posts');
        const q = query(
            postsRef,
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() ?? new Date(),
            } as Post));

            const postsWithAuthors = await fetchAndAttachAuthorData(postsData);
            
            const postsWithLikes = await Promise.all(postsWithAuthors.map(async (post) => {
                const likeRef = doc(firestore, 'posts', post.id, 'likes', user.uid);
                const likeSnap = await getDoc(likeRef);
                return { ...post, isLiked: likeSnap.exists() };
            }));

            setPosts(postsWithLikes);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching feed:", err);
            setError("Could not load the community feed.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    if (loading || authLoading) {
        return <FeedSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 p-8 rounded-lg">
                <ServerCrash className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">{error}</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">Log in to see the feed</h3>
                <p className="mt-1 text-sm">Posts from the community will appear here.</p>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">The feed is quiet...</h3>
                <p className="mt-1 text-sm">Be the first to share something with the community!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {posts.map(post => (
                <FeedPost key={post.id} post={post} />
            ))}
        </div>
    );
}
