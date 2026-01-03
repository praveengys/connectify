
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile, Group, Thread } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

const StatCard = ({ title, value, icon: Icon, href }: { title: string, value: number, icon: React.ElementType, href: string }) => (
    <Link href={href}>
        <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">Click to manage</p>
            </CardContent>
        </Card>
    </Link>
);

const RecentSignups = ({ users, loading }: { users: UserProfile[], loading: boolean }) => (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader>
            <CardTitle>Recent Sign-ups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             {loading && Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
            {!loading && users.map(user => (
                <div key={user.uid} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</p>
                    </div>
                </div>
            ))}
             {!loading && users.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent sign-ups.</p>
             )}
        </CardContent>
    </Card>
)

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({ users: 0, groups: 0, threads: 0 });
    const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !user || user.role !== 'admin') {
            if (!authLoading) setLoading(false);
            return;
        }

        const { firestore } = initializeFirebase();
        const collections = {
            users: collection(firestore, 'users'),
            groups: collection(firestore, 'groups'),
            threads: collection(firestore, 'threads'),
        };

        const unsubscribes = [
            onSnapshot(collections.users, snapshot => setStats(s => ({ ...s, users: snapshot.size }))),
            onSnapshot(collections.groups, snapshot => setStats(s => ({ ...s, groups: snapshot.size }))),
            onSnapshot(collections.threads, snapshot => setStats(s => ({ ...s, threads: snapshot.size }))),
            onSnapshot(query(collections.users, orderBy('createdAt', 'desc'), limit(5)), snapshot => {
                const users = snapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() ?? new Date(),
                } as UserProfile));
                setRecentUsers(users);
                setLoading(false);
            }),
        ];

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, authLoading]);

  return (
    <div>
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={stats.users} icon={Users} href="/admin/users" />
            <StatCard title="Total Groups" value={stats.groups} icon={MessageSquare} href="/admin/groups" />
            <StatCard title="Total Discussions" value={stats.threads} icon={BookOpen} href="/admin/discussions" />
            <RecentSignups users={recentUsers} loading={loading || authLoading} />
        </div>
    </div>
  );
}
