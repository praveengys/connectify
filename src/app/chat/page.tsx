
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, PlusCircle, ServerCrash, Users } from 'lucide-react';
import Link from 'next/link';
import CreateGroupForm from '@/components/chat/CreateGroupForm';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { firestore } = initializeFirebase();
    const groupsRef = collection(firestore, 'groups');
    const q = query(
      groupsRef,
      where('type', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        } as Group));
        setGroups(groupsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching chat groups:", err);
        setError("Could not load chat groups. Please try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);
  
  const handleGroupCreated = () => {
      // The onSnapshot listener will automatically add the new group.
      setCreateGroupOpen(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold">Chat Groups</h1>
            <p className="text-muted-foreground mt-2">
              Join a conversation or create your own group.
            </p>
          </div>
          {user && (
            <Dialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Group
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a new chat group</DialogTitle>
                    </DialogHeader>
                    <CreateGroupForm onGroupCreated={handleGroupCreated} />
                </DialogContent>
            </Dialog>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-8">
            <ServerCrash className="h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Error Loading Groups</p>
            <p className="text-sm text-center">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => (
              <Link href={`/chat/${group.id}`} key={group.id} passHref>
                <Card className="card-hover cursor-pointer h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                     <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {group.lastMessage?.text || 'No messages yet...'}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{group.memberCount || 0} members</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
             {groups.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No public groups</h3>
                    <p className="mt-1 text-sm">Be the first to create one!</p>
                </div>
              )}
          </div>
        )}
      </main>
      <footer className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

    