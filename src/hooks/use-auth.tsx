'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { createUserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  authProvider: string;
  profileVisibility: 'public' | 'private';
  createdAt: Date;
  updatedAt: Date;
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
    const handleAuthChange = async (fbUser: User | null) => {
      if (fbUser) {
        let profile = await getUserProfile(fbUser.uid);

        if (!profile) {
          const newUserProfileData = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName,
            photoURL: fbUser.photoURL,
            authProvider: fbUser.providerData[0]?.providerId || 'password',
            profileVisibility: 'public' as 'public' | 'private',
          };
          await createUserProfile(fbUser.uid, newUserProfileData);
          profile = await getUserProfile(fbUser.uid);
        }
        setUserProfile(profile as UserProfile);
      } else {
        setUserProfile(null);
      }
       setLoading(false);
    };
    
    if(!isUserLoading) {
      handleAuthChange(firebaseUser);
    }
  }, [firebaseUser, isUserLoading]);

  return (
    <AuthContext.Provider value={{ user: userProfile, loading }}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="sr-only">Loading application...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
