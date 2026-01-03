
'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';

export type UserProfileWithUser = User & UserProfile;

export interface AuthContextType {
  user: UserProfileWithUser | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfileWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If we have a user, start listening to their profile document
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        
        onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userProfileData = docSnap.data() as UserProfile;

                // Force refresh of custom claims when user data changes.
                // This is important for role changes to take effect immediately.
                firebaseUser.getIdToken(true);

                // Combine Firebase User and UserProfile data
                setUser({
                    ...firebaseUser,
                    ...userProfileData,
                    uid: firebaseUser.uid // Ensure Firebase UID is authoritative
                });
            } else {
                // This case might happen briefly if the user document hasn't been created yet.
                // We can set a minimal user object and wait for creation.
                 setUser({
                    ...firebaseUser,
                    // Provide default/fallback values for UserProfile fields
                    username: firebaseUser.email?.split('@')[0] || '',
                    displayName: firebaseUser.displayName || 'New User',
                    bio: '',
                    avatarUrl: firebaseUser.photoURL || null,
                    interests: [],
                    skills: [],
                    languages: [],
                    location: '',
                    currentlyExploring: '',
                    role: 'member', // Default role
                    profileVisibility: 'public',
                    emailVerified: firebaseUser.emailVerified,
                    profileScore: 0,
                    postCount: 0,
                    commentCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastActiveAt: new Date(),
                });
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching user profile:", err);
            setError(err);
            setLoading(false);
        });
        
         // Also listen for ID token changes to get updated custom claims (like role)
        onIdTokenChanged(auth, async (refreshedUser) => {
          if (refreshedUser) {
            const tokenResult = await refreshedUser.getIdTokenResult();
            const claims = (tokenResult.claims as { role?: 'admin' | 'moderator' | 'member' }) || {};
            
            setUser(currentUser => {
              if (currentUser && currentUser.uid === refreshedUser.uid && currentUser.role !== claims.role) {
                // If role has changed, update the user state
                return { ...currentUser, role: claims.role || 'member' };
              }
              return currentUser;
            });
          }
        });


      } else {
        // No user is signed in
        setUser(null);
        setLoading(false);
      }
    }, (err) => {
        console.error("Auth state change error:", err);
        setError(err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
