

'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { createUserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { useFirebaseUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { UserProfile as UserProfileType } from '@/lib/types';
import { getAuth, getIdTokenResult } from 'firebase/auth';


// Re-export the type from lib/types to avoid circular dependencies
export type UserProfile = UserProfileType;

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
      let finalProfile: UserProfile | null = null;
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        finalProfile = {
          ...profileData,
          uid: docSnap.id,
          createdAt: profileData.createdAt?.toDate(),
          updatedAt: profileData.updatedAt?.toDate(),
          email: firebaseUser.email,
        } as UserProfile;
      } else {
        // First-time user, create a profile.
        console.log(`Creating profile for new user: ${firebaseUser.uid}`);
        const newProfile = await createUserProfile(firebaseUser.uid, {
          displayName: firebaseUser.displayName || 'New Member',
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          avatarUrl: firebaseUser.photoURL,
        });
        // The onSnapshot listener will automatically pick up the newly created profile.
        // But we can set it here to speed up the UI update.
        if (newProfile) {
            finalProfile = newProfile;
        }
      }

      // Sync custom claims to the profile state
      if (finalProfile) {
          try {
              const auth = getAuth();
              const tokenResult = await getIdTokenResult(auth.currentUser!, true); // Force refresh
              const claims = tokenResult.claims;
              finalProfile.role = (claims.role as 'admin' | 'member') || 'member';
              finalProfile.isBanned = claims.banned === true;
              finalProfile.isMuted = claims.muted === true;
          } catch (e) {
              console.error("Error fetching custom claims:", e);
          }
      }

      setUserProfile(finalProfile);
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
