'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // DEBUG: Log every state change
  console.log('🔍 AuthRedirect render:', { user: !!user, loading, userEmail: user?.email });

  useEffect(() => {
    console.log('⚡ useEffect:', { user: !!user, loading });
    if (!loading && user) {
      console.log('🚀 REDIRECTING TO /dashboard');
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
