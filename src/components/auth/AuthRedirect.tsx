'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is complete before checking for a user.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // While the auth state is being determined, show a loader.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="sr-only">Loading...</p>
      </div>
    );
  }

  // If loading is finished and there's no user, show the children (e.g., the login form).
  if (!user) {
    return <>{children}</>;
  }
  
  // If there IS a user, the useEffect will trigger the redirect.
  // While that happens, we show a loader to prevent a flash of the login page.
  return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="sr-only">Redirecting...</p>
      </div>
  );
}
