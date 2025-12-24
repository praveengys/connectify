'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, FirestoreError } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ServerCrash } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/use-auth';

export default function MembersClient() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // We can use this to know if the user is logged in

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { firestore } = initializeFirebase();
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('profileVisibility', '==', 'public'));
        const querySnapshot = await getDocs(q);
        const membersData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                uid: doc.id, // Ensure uid is the document ID
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as UserProfile
        });
        setMembers(membersData);
      } catch (e: any) {
        console.error("Error fetching members: ", e);
        if (e.code === 'permission-denied') {
          setError('You do not have permission to view the member list. This may be a configuration issue.');
        } else if (e instanceof FirestoreError) {
             setError(`Error fetching members: ${e.message}.`);
        } else {
            setError('An unexpected error occurred while fetching members.');
        }
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  return (
    <section className="w-full py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Community Members
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
            Browse the profiles of our public community members.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {error && (
            <div className="flex flex-col items-center justify-center h-64 text-destructive bg-destructive/10 p-8 rounded-lg">
                <ServerCrash className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Could not load members</p>
                <p className="text-sm text-center max-w-md">{error}</p>
            </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map(member => (
              <Card key={member.uid} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={member.avatarUrl ?? undefined} alt={member.displayName ?? 'user'} />
                    <AvatarFallback>{member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{member.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{member.username || 'new_member'}</p>
                  <p className="text-sm mt-2 text-muted-foreground line-clamp-2 h-10">
                    {member.bio || 'No bio available.'}
                  </p>
                   <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {member.interests?.slice(0, 3).map(interest => (
                      <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && members.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <h3 className="mt-4 text-lg font-semibold">No Public Members</h3>
                <p className="mt-1 text-sm">It looks like there are no public member profiles to display right now.</p>
            </div>
        )}
      </div>
    </section>
  );
}
