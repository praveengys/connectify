
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { UserProfile } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '../ui/input';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useFirebase } from '@/firebase/client-provider';

export default function MembersClient() {
  const { firestore } = useFirebase();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setLoading(false);
        return;
    }

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, orderBy('displayName', 'asc'));
    
    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id,
            createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        } as UserProfile));
        setMembers(membersData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching members:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, firestore]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) {
      return members;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return members.filter(member => 
      member.displayName.toLowerCase().includes(lowercasedQuery) ||
      (member.memberEmailAddress && member.memberEmailAddress.toLowerCase().includes(lowercasedQuery))
    );
  }, [members, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Community Members
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
              Browse profiles, discover skills, and connect with peers.
            </p>
          </div>

          {(loading || authLoading) && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          
          {!user && !authLoading && (
             <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
                  <p className="mt-1 text-sm">You must be logged in to view community members.</p>
                  <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
              </div>
          )}

          {!loading && user && (
            <>
              <div className="mb-8 max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="search"
                    placeholder="Search by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredMembers.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredMembers.map(member => (
                    <Card key={member.uid} className="card-hover">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={member.avatarUrl ?? undefined} alt={member.displayName ?? 'user'} />
                          <AvatarFallback>{member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg">{member.displayName}</h3>
                        <p className="text-sm text-muted-foreground">ID: {member.memberId || 'new_member'}</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          <Badge variant="secondary">{member.memberType}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No Members Found</h3>
                    <p className="mt-1 text-sm">Your search for "{searchQuery}" did not match any members.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      </main>
      <footer className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
