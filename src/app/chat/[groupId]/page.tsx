
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ChatRoomClient from '@/components/chat/ChatRoomClient';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Group } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ServerCrash } from 'lucide-react';


export default function ChatRoomPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (authLoading || !user || !groupId) {
          if (!authLoading && !user) {
              setError("You must be logged in to view a chat.");
              setLoading(false);
          }
          return;
      }
      
      setLoading(true);
      const { firestore } = initializeFirebase();
      const groupRef = doc(firestore, 'groups', groupId);
      
      const unsubscribe = onSnapshot(groupRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              // Security check: Client must verify membership for private groups
              const isMember = data.members && data.members[user.uid];
              if(data.type === 'private' && !isMember) {
                   setError("You are not a member of this private group.");
                   setGroup(null);
              } else {
                setGroup({
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                } as Group);
                setError(null);
              }
          } else {
              setError("This chat group does not exist.");
              setGroup(null);
          }
          setLoading(false);
      }, (err) => {
          console.error("Error fetching group:", err);
          setError("Failed to load chat group data.");
          setLoading(false);
      });

      return () => unsubscribe();
  }, [groupId, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="flex flex-col h-screen">
          <Header />
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 p-8 rounded-lg">
                <ServerCrash className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">{error}</p>
            </div>
          </div>
        </div>
     )
  }

  if (!group) {
    notFound();
  }
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <ChatRoomClient group={group} />
    </div>
  );
}
