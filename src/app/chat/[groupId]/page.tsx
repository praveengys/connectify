
'use client';

import { useEffect, useState } from 'react';
import ChatRoomClient from '@/components/chat/ChatRoomClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Group } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ServerCrash, UserPlus } from 'lucide-react';
import { joinChatGroup } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ChatLayout from '@/components/chat/ChatLayout';
import GroupInfoPanel from '@/components/chat/GroupInfoPanel';


export default function ChatRoomPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
      if (authLoading || !user) {
          if (!authLoading) {
            setLoading(false);
            setError("You must be logged in to view a chat.");
          }
          return;
      }
      
      setLoading(true);
      const { firestore } = initializeFirebase();
      const groupRef = doc(firestore, 'groups', groupId);
      
      const unsubscribe = onSnapshot(groupRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              const memberStatus = data.members && data.members[user.uid];
              setIsMember(!!memberStatus);
              
              if(data.type === 'private' && !memberStatus) {
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

  const handleJoinGroup = async () => {
    if (!user || !group) return;
    setJoinLoading(true);
    try {
      await joinChatGroup(group.id, user.uid);
      toast({
        title: 'Success!',
        description: `You have joined the group "${group.name}".`,
      });
      // The onSnapshot listener will update the isMember state automatically.
    } catch (error: any) {
      toast({
        title: 'Error Joining Group',
        description: error.message || "Could not join the group.",
        variant: 'destructive',
      });
    } finally {
      setJoinLoading(false);
    }
  };


  if (loading || authLoading) {
    return (
      <ChatLayout>
        <div className="flex h-full w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ChatLayout>
    );
  }

  if (error) {
     return (
        <ChatLayout>
          <div className="flex-grow flex items-center justify-center h-full">
            <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 p-8 rounded-lg">
                <ServerCrash className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">{error}</p>
            </div>
          </div>
        </ChatLayout>
     )
  }

  if (!group) {
      return (
        <ChatLayout>
          <div className="flex h-full w-full items-center justify-center bg-background">
             <p>Select a chat to start messaging.</p>
          </div>
        </ChatLayout>
      )
  }
  
  return (
    <ChatLayout rightPanel={<GroupInfoPanel group={group} />}>
      {isMember ? (
         <ChatRoomClient group={group} />
      ): (
        <div className="flex-grow flex flex-col items-center justify-center gap-4 p-4 text-center h-full">
          <h2 className="text-2xl font-bold">You are not a member of this group</h2>
          <p className="text-muted-foreground max-w-md">
            Join "{group.name}" to view the conversation and send messages.
          </p>
          <Button onClick={handleJoinGroup} disabled={joinLoading}>
            {joinLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Join Group
          </Button>
        </div>
      )}
    </ChatLayout>
  );
}
