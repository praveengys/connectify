
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { getUserProfile, createUserProfile, updateUserProfile } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';

export type User = UserProfile;

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let userProfile = await getUserProfile(firebaseUser.uid);
        
        // Special role assignment for testing
        const adminEmail = 'tnbit@gmail.com';
        const moderatorEmail = 'tnbit2@gmail.com';
        let role: 'member' | 'admin' | 'moderator' = 'member';
        
        if (firebaseUser.email === adminEmail) {
            role = 'admin';
        } else if (firebaseUser.email === moderatorEmail) {
            role = 'moderator';
        }

        if (!userProfile) {
          await createUserProfile(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            avatarUrl: firebaseUser.photoURL,
            role: role,
          });
          userProfile = await getUserProfile(firebaseUser.uid);
        } else if (userProfile.role !== role) {
            // If the user exists but their role doesn't match our special assignment, update it.
            await updateUserProfile(firebaseUser.uid, { role });
            userProfile.role = role;
        }

        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
