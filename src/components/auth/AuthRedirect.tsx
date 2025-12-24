'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * This component handles two scenarios for authentication-related pages (Login, Sign Up):
 * 1. If the user is already logged in, it redirects them to the dashboard.
 * 2. While authentication state is being determined, it shows a loading screen.
 * 3. If the user is not logged in, it renders the children (the login/signup form).
 */
export default function AuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is finished before attempting to redirect.
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // If we are still checking the auth state, or if the user is logged in
  // and we are about to redirect, show a full-page loader.
  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="sr-only">Loading...</p>
      </div>
    );
  }

  // If loading is finished and there's no user, render the child components (e.g., the login form).
  return <>{children}</>;
}
