

'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { createUserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { useFirebaseUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

// This defines the rich user profile object, combining auth and firestore data.
export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  company: string;
  avatarUrl: string | null;
  interests: string[];
  skills: string[];
  languages: string[];
  location: string;
  currentlyExploring: string;
  role: 'member' | 'moderator' | 'admin';
  profileVisibility: 'public' | 'private';
  emailVerified: boolean;
  profileScore: number;
  postCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  // Include email from auth for convenience
  email?: string | null;
}

export interface Forum {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    visibility: 'public' | 'private';
    status: 'active' | 'suspended';
    createdAt: Date;
}
  
export interface Group {
    id: string;
    name: string;
    type: 'public' | 'private';
    createdBy: string;
    createdAt: Date;
    memberCount: number;
    members: { [uid: string]: 'owner' | 'admin' | 'member' };
}

export interface Thread {
    id: string;
    title: string;
    body: string;
    authorId: string;
    createdAt: Date;
}


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean; // A single loading state for the entire auth flow.
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, isUserLoading } = useFirebaseUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      // Still waiting for Firebase to confirm auth state
      return;
    }

    if (!firebaseUser) {
      // User is logged out
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    // User is logged in, fetch or create profile and listen for updates.
    const { firestore } = initializeFirebase();
    const profileRef = doc(firestore, 'users', firebaseUser.uid);

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        setUserProfile({
          ...profileData,
          uid: docSnap.id,
          createdAt: profileData.createdAt?.toDate(),
          updatedAt: profileData.updatedAt?.toDate(),
          email: firebaseUser.email,
        } as UserProfile);
      } else {
        // First-time user, create a profile.
        console.log(`Creating profile for new user: ${firebaseUser.uid}`);
        await createUserProfile(firebaseUser.uid, {
          displayName: firebaseUser.displayName || 'New Member',
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          avatarUrl: firebaseUser.photoURL,
        });
        // The onSnapshot listener will automatically pick up the newly created profile.
      }
      setProfileLoading(false);
    }, (error) => {
        console.error("Error listening to user profile:", error);
        setProfileLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [firebaseUser, isUserLoading]);

  return (
    <AuthContext.Provider value={{ user: userProfile, loading: isUserLoading || isProfileLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

    

    