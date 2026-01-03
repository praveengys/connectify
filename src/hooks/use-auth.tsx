
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/firebase/client-provider';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export type UserState = UserProfile | null;

interface AuthContextType {
  user: UserState;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<UserState>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // User is signed in, listen to their profile document
        const userRef = doc(firestore, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const profileData = doc.data() as Omit<UserProfile, 'uid' | 'emailVerified'>;
            
            let displayName = profileData.displayName;
            if (!displayName && profileData.memberFirstName) {
                displayName = `${profileData.memberFirstName} ${profileData.memberLastName || ''}`.trim();
            }

            setUser({
              ...profileData,
              displayName,
              uid: firebaseUser.uid,
              emailVerified: firebaseUser.emailVerified,
            });
          } else {
            // Profile doesn't exist yet, which might be a transitional state during sign-up.
            // For now, we can set a minimal user object or null.
             setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'New Member',
              avatarUrl: firebaseUser.photoURL,
              role: 'member',
              emailVerified: firebaseUser.emailVerified,
             } as UserProfile);
          }
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
