'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// This function ensures Firebase is initialized only once.
// It is safe to call this function multiple times.
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // In a client-side environment, we directly use the imported config.
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

// Helper to get all the SDKs from the app instance.
function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
