'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login page.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // While loading, or if there's no user, show a loading screen.
  // This is the crucial gate that ensures children are only rendered when user data is ready.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="sr-only">Loading...</p>
      </div>
    );
  }

  // Once loading is false and user exists, render the full dashboard.
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
    </div>
  );
}