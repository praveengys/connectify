'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

// This is a client component that will listen for permission errors
// and throw them to be caught by the Next.js error overlay.
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (permissionError: FirestorePermissionError) => {
      setError(permissionError);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  if (error) {
    // Throwing the error here will cause the Next.js development error
    // overlay to appear, which is exactly what we want for debugging.
    throw error;
  }

  return null;
}
