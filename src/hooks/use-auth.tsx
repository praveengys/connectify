'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createUserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { useFirebaseUser } from '@/firebase/provider';

// This defines the rich user profile object, combining auth and firestore data.
export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
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


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean; // A single loading state for the entire auth flow.
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Get the raw Firebase user and its loading state from the FirebaseProvider.
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useFirebaseUser();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // If the initial auth check isn't done, we can't do anything yet.
    if (isAuthLoading) {
      return;
    }

    // If there's no Firebase user, reset the profile and finish loading.
    if (!firebaseUser) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }
    
    // If we already have the correct profile loaded, do nothing.
    if(userProfile?.uid === firebaseUser.uid) {
      setProfileLoading(false);
      return;
    }

    // Auth is ready and we have a user. Let's fetch their profile.
    setProfileLoading(true);
    const fetchProfile = async () => {
      let profile = await getUserProfile(firebaseUser.uid);

      if (!profile) {
        // If no profile exists, create a default one.
        const newUserProfileData = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'New Member',
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          avatarUrl: firebaseUser.photoURL,
          profileVisibility: 'public' as 'public',
          role: 'member' as 'member',
        };
        await createUserProfile(firebaseUser.uid, newUserProfileData);
        profile = await getUserProfile(firebaseUser.uid); // Re-fetch the newly created profile
      }
      
      setUserProfile(profile as UserProfile);
      setProfileLoading(false);
    };

    fetchProfile();
  }, [firebaseUser, isAuthLoading, userProfile?.uid]);

  // The final loading state is true if either the auth check or the profile fetch is ongoing.
  const isLoading = isAuthLoading || isProfileLoading;

  return (
    <AuthContext.Provider value={{ user: userProfile, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// The hook that all components will use to get the final user profile and loading state.
export const useAuth = () => useContext(AuthContext);
