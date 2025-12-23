'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { createUserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { useUser } from '@/firebase';

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
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, isUserLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function handles the logic for a signed-in user
    const handleSignedInUser = async (fbUser: User) => {
      // Ensure we don't re-fetch if the profile is already loaded for the current user
      if (userProfile?.uid === fbUser.uid) {
        setLoading(false);
        return;
      }
      
      let profile = await getUserProfile(fbUser.uid);

      if (!profile) {
        // If no profile exists, create one.
        const newUserProfileData = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'New Member',
          email: fbUser.email,
          emailVerified: fbUser.emailVerified,
          avatarUrl: fbUser.photoURL,
          authProvider: fbUser.providerData[0]?.providerId || 'password',
          profileVisibility: 'public' as 'public' | 'private',
          role: 'member' as 'member',
          username: '',
          bio: '',
          interests: [],
          skills: [],
          languages: [],
          location: '',
          currentlyExploring: '',
          profileScore: 0,
          postCount: 0,
          commentCount: 0,
        };
        await createUserProfile(fbUser.uid, newUserProfileData);
        profile = await getUserProfile(fbUser.uid); // Re-fetch the newly created profile
      }
      setUserProfile(profile as UserProfile);
      setLoading(false); // Stop loading only after profile is fetched/created
    };

    // This function handles the logic for a signed-out user
    const handleSignedOutUser = () => {
      setUserProfile(null);
      setLoading(false);
    };

    // Always show loading state while the initial Firebase user check is running
    if (isUserLoading) {
      setLoading(true);
      return;
    }

    if (firebaseUser) {
      // We have a firebase user, now fetch their profile. `handleSignedInUser` will set loading to false.
      setLoading(true);
      handleSignedInUser(firebaseUser);
    } else {
      // No firebase user, we are done loading.
      handleSignedOutUser();
    }
  }, [firebaseUser, isUserLoading]);

  // The AuthProvider now only passes the context, the loading UI is handled by layouts.
  return (
    <AuthContext.Provider value={{ user: userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
