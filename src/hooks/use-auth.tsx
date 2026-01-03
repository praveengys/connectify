'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase/client-provider';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        // Unsubscribe from any previous profile listener
        unsubscribeProfile();

        if (firebaseUser) {
          const profileRef = doc(firestore, 'users', firebaseUser.uid);
          unsubscribeProfile = onSnapshot(
            profileRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const profileData = docSnap.data();
                const displayName = profileData.displayName || `${profileData.memberFirstName || ''} ${profileData.memberLastName || ''}`.trim();

                setUser({
                  ...profileData,
                  uid: firebaseUser.uid,
                  emailVerified: firebaseUser.emailVerified,
                  displayName: displayName,
                  createdAt: profileData.createdAt?.toDate() ?? new Date(),
                } as UserProfile);
              } else {
                 // This can happen briefly during sign-up. 
                 // We set a minimal user object and wait for the profile to be created.
                setUser({
                  uid: firebaseUser.uid,
                  emailVerified: firebaseUser.emailVerified,
                  displayName: firebaseUser.displayName || 'New Member',
                  role: 'member',
                } as UserProfile)
              }
              setLoading(false);
            },
            (profileError) => {
              console.error('Error fetching user profile:', profileError);
              setError(profileError);
              setLoading(false);
              signOut(auth); // Sign out on profile error
            }
          );
        } else {
          setUser(null);
          setLoading(false);
        }
      },
      (authError) => {
        console.error('Authentication error:', authError);
        setError(authError);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, [auth, firestore]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
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
