
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';

export type UserProfileWithUser = UserProfile & {
  user: User; // The original Firebase Auth User object
};

type AuthContextType = {
  user: UserProfile | null;
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
    const { auth, firestore } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userRef = doc(firestore, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userProfile = {
              uid: docSnap.id,
              ...docSnap.data(),
              createdAt: docSnap.data().createdAt?.toDate() ?? new Date(),
            } as UserProfile;

            // --- ADMIN UPGRADE LOGIC ---
            // If the user is 'tnbit@gmail.com' and their role is not 'admin', upgrade them.
            if (userProfile.email === 'tnbit@gmail.com' && userProfile.role !== 'admin') {
              updateDoc(doc(firestore, 'users', userProfile.uid), { role: 'admin' })
                .then(() => {
                  // The onSnapshot listener will automatically update the local state
                  console.log('User tnbit@gmail.com has been upgraded to admin.');
                })
                .catch(error => {
                  console.error('Error upgrading user to admin:', error);
                });
            } else {
               setUser(userProfile);
            }
            // --- END ADMIN UPGRADE LOGIC ---
          } else {
            // This case might happen if the user profile is not created yet
            // or if there's a delay. For now, we assume it exists if logged in.
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
           console.error("Error fetching user profile:", error);
           setUser(null);
           setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
