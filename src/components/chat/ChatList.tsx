
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Search, ServerCrash, Users } from 'lucide-react';
import Link from 'next/link';
import CreateGroupForm from '@/components/chat/CreateGroupForm';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

export default function ChatList() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      if(!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    const { firestore } = initializeFirebase();
    const groupsRef = collection(firestore, 'groups');
    // For now, we list all public groups. A more advanced implementation might list groups the user is a member of.
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
        setError("Could not load chat groups.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleGroupCreated = () => {
    setCreateGroupOpen(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Messages</h2>
        <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search groups..." className="pl-8" />
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-2 space-y-1">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center text-destructive p-4">
              <ServerCrash className="h-8 w-8 mb-2" />
              <p className="text-sm text-center">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {groups.map(group => {
                const isActive = pathname === `/chat/${group.id}`;
                return (
                  <Link href={`/chat/${group.id}`} key={group.id} passHref>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isActive ? "bg-primary/10 text-primary-chat" : "hover:bg-accent"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{group.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                           {group.memberCount} members
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
              {groups.length === 0 && !authLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">{user ? "No public groups found." : "Please log in to see groups."}</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t mt-auto">
        <Dialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!user}>
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
      </div>
    </div>
  );
}
