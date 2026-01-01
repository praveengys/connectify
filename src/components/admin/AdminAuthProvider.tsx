
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role !== 'admin') {
     return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-destructive">
            <ShieldAlert className="h-12 w-12" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-center text-muted-foreground">You do not have permission to view this page. Redirecting...</p>
        </div>
      </div>
     )
  }

  return <>{children}</>;
}
