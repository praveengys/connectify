
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, MessageSquare, Users } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useFirebase } from '@/firebase/client-provider';

const StatCard = ({ title, value, icon: Icon, href }: { title: string, value: string | number, icon: React.ElementType, href: string }) => (
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


export default function ModeratorDashboard() {
  const { firestore } = useFirebase();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ reports: 0, discussions: 0, users: 0 });

  useEffect(() => {
    if (authLoading || !user || !firestore) return;

    const unsubscribes = [
      onSnapshot(query(collection(firestore, 'reports'), where('status', '==', 'open')), snapshot => 
        setStats(s => ({ ...s, reports: snapshot.size }))
      ),
      onSnapshot(collection(firestore, 'threads'), snapshot => 
        setStats(s => ({ ...s, discussions: snapshot.size }))
      ),
      onSnapshot(collection(firestore, 'users'), snapshot => 
        setStats(s => ({ ...s, users: snapshot.size }))
      ),
    ];
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, authLoading, firestore]);

  return (
    <div>
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
            <p className="text-muted-foreground">Oversee community activity and manage content.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Open Reports" value={stats.reports} icon={Flag} href="/moderator/reports" />
            <StatCard title="Total Discussions" value={stats.discussions} icon={MessageSquare} href="/moderator/discussions" />
            <StatCard title="Total Users" value={stats.users} icon={Users} href="/moderator/users" />
        </div>
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Welcome, Moderator!</CardTitle>
                <CardDescription>
                    This is your central hub for community moderation. From here, you can review reported content, monitor user activity, and ensure discussions remain healthy and productive.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Use the navigation on the left to access different moderation tools.</p>
            </CardContent>
        </Card>
    </div>
  );
}
