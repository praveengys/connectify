
'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Group } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function ActiveGroups() {
    const { user, loading: authLoading } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setLoading(false);
            return;
        }

        const { firestore } = initializeFirebase();
        const groupsRef = collection(firestore, 'groups');
        const q = query(
            groupsRef, 
            where('type', '==', 'public'),
            orderBy('memberCount', 'desc'), 
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Group));
            setGroups(groupsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching active groups:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Active Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {(loading || authLoading) && (
                    <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
                {!loading && !authLoading && user && groups.map(group => (
                     <Link href={`/chat/${group.id}`} key={group.id} className="block hover:bg-accent rounded-lg p-2 -m-2">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Users className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm leading-tight">{group.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">{group.memberCount} members</p>
                            </div>
                        </div>
                    </Link>
                ))}
                {!loading && !authLoading && (!user || groups.length === 0) && (
                     <p className="text-sm text-center text-muted-foreground py-4">No active groups yet.</p>
                )}
                 {!loading && (
                     <Button variant="outline" className="w-full" asChild>
                        <Link href="/chat">
                            See All Groups
                        </Link>
                     </Button>
                 )}
            </CardContent>
        </Card>
    );
}
