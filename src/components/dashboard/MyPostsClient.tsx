
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Post, UserProfile } from '@/lib/types';
import FeedPost from './FeedPost';
import { Loader2, ServerCrash, FileText } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Button } from '../ui/button';

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

export default function MyPostsClient() {
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
            where('authorId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() ?? new Date(),
            } as Post));

            // Since we know the author is the current user, we can attach it directly
            const postsWithAuthors = postsData.map(post => ({
                ...post,
                author: {
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                    memberId: user.memberId
                }
            }));
            
            const postsWithLikes = await Promise.all(postsWithAuthors.map(async (post) => {
                const likeRef = doc(firestore, 'posts', post.id, 'likes', user.uid);
                const likeSnap = await getDoc(likeRef);
                return { ...post, isLiked: likeSnap.exists() };
            }));

            setPosts(postsWithLikes);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching user posts:", err);
            setError("Could not load your posts.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);
    
    const renderContent = () => {
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
                    <h3 className="text-lg font-semibold">Please Log In</h3>
                    <p className="mt-1 text-sm">Log in to see your posts.</p>
                     <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
                </div>
            )
        }

        if (posts.length === 0) {
            return (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <FileText className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">You haven't posted anything yet</h3>
                    <p className="mt-1 text-sm">Your posts will appear here once you create them.</p>
                     <Button asChild className="mt-4"><Link href="/dashboard">Create a Post</Link></Button>
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
    
    return (
        <div className="p-4 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">My Posts</h1>
                {renderContent()}
            </div>
        </div>
    );
}
