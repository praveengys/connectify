import Header from '@/components/Header';
import ChatRoomClient from '@/components/chat/ChatRoomClient';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Group } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getGroup(groupId: string): Promise<Group | null> {
  const { firestore } = initializeFirebase();
  const groupRef = doc(firestore, 'groups', groupId);
  const docSnap = await getDoc(groupRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
  } as Group;
}

export default async function ChatRoomPage({ params }: { params: { groupId: string } }) {
  const group = await getGroup(params.groupId);

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
