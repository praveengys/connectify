'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';

// This context will hold all our Firebase instances and auth state.
interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null; // The raw Firebase Auth user object
  isUserLoading: boolean; // Is the initial auth state check complete?
}

// Create the context with an undefined initial value.
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setUserLoading] = useState(true);

  // Subscribe to auth state changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setUserLoading(false); // Auth check is complete.
    });

    return () => unsubscribe(); // Cleanup subscription on unmount.
  }, [auth]);

  // Memoize the context value to prevent unnecessary re-renders.
  const contextValue = useMemo(() => ({
    firebaseApp,
    firestore,
    auth,
    user,
    isUserLoading,
  }), [firebaseApp, firestore, auth, user, isUserLoading]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to easily access the raw Firebase user and loading state.
export const useFirebaseUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseUser must be used within a FirebaseProvider.');
  }
  return {
    user: context.user,
    isUserLoading: context.isUserLoading,
    auth: context.auth,
  };
};
