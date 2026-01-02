
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useAuth } from './use-auth';
import type { Notification, UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/firebase/firestore';

export function useNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSenders = useCallback(async (notifs: Notification[]) => {
    const senderIds = [...new Set(notifs.map(n => n.senderId).filter(Boolean))];
    if (senderIds.length === 0) return notifs;

    try {
        const senderProfiles = await Promise.all(
            senderIds.map(id => getUserProfile(id as string))
        );
        const sendersMap = new Map<string, UserProfile>();
        senderProfiles.forEach(sender => {
            if (sender) sendersMap.set(sender.uid, sender);
        });

        return notifs.map(n => ({
            ...n,
            sender: n.senderId ? sendersMap.get(n.senderId) : undefined,
        }));
    } catch (error) {
        console.error("Error fetching sender profiles:", error);
        return notifs; // Return original notifications on error
    }
  }, []);


  useEffect(() => {
    // Critical fix: Do not proceed if auth is loading or user is not available.
    // This prevents invalid queries from being created.
    if (authLoading || !user) {
      setLoading(!authLoading); // If auth is done and no user, set loading to false.
      setNotifications([]);
      return;
    }

    const { firestore } = initializeFirebase();
    const notifsRef = collection(firestore, 'users', user.uid, 'notifications');
    const q = query(notifsRef, orderBy('createdAt', 'desc'));

    setLoading(true);
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const notifsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        } as Notification));
        
        const notifsWithSenders = await fetchSenders(notifsData);
        setNotifications(notifsWithSenders);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, fetchSenders]);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, loading, unreadCount };
}
