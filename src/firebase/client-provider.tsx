'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseApp = useMemo(() => initializeApp(firebaseConfig), []);
  const auth = useMemo(() => getAuth(firebaseApp), [firebaseApp]);
  const firestore = useMemo(() => getFirestore(firebaseApp), [firebaseApp]);
  
  const contextValue = useMemo(() => ({
    firebaseApp,
    auth,
    firestore,
  }), [firebaseApp, auth, firestore]);

  return (
    <FirebaseContext.Provider value={contextValue}>
        {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
