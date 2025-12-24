'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      console.log('🔄 REDIRECTING TO DASHBOARD'); // DEBUG
      router.replace('/dashboard'); // replace instead of push
    }
  }, [user, loading, router]);

  // CRITICAL FIX: ONLY loading, NOT "loading || user"
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
