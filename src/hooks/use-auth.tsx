
'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { getAuth } from 'firebase/auth';

export interface UserProfile extends DocumentData {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  username: string;
  bio: string;
  interests: string[];
  skills: string[];
  languages: string[];
  location: string;
  currentlyExploring: string;
  company: string;
  role: 'member' | 'admin' | 'moderator';
  profileVisibility: 'public' | 'private';
  isMuted?: boolean;
  isBanned?: boolean;
  createdAt: Date;
}

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();
    
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const userRef = doc(firestore, 'users', firebaseUser.uid);
        
        const userUnsubscribe = onSnapshot(userRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setUser({
                ...userData,
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: userData.displayName || firebaseUser.displayName,
                avatarUrl: userData.avatarUrl || firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                role: tokenResult.claims.role || 'member',
                createdAt: userData.createdAt?.toDate() ?? new Date(),
              } as UserProfile);
            }
            setLoading(false);
          }, 
          (err) => {
            console.error("Error fetching user profile:", err);
            setError(err);
            setLoading(false);
          }
        );

        return () => userUnsubscribe();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

    