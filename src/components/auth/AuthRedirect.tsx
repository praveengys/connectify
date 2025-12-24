'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is finished before attempting to redirect.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // If we are still checking the auth state, show a full-page loader.
  // This component will not render its children until the initial auth check is complete.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="sr-only">Loading...</p>
      </div>
    );
  }
  
  // If a user is logged in, the useEffect above will trigger a redirect.
  // We can return null or a loader here, as it will be replaced by the dashboard page.
  if (user) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Redirecting...</p>
      </div>
    );
  }


  // If loading is finished and there's no user, render the child components (e.g., the login form).
  return <>{children}</>;
}
