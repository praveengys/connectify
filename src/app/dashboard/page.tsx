
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardClient from '@/components/dashboard/DashboardClient';
import RightSidebar from '@/components/dashboard/RightSidebar';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-theme(height.14))] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="sr-only">Loading...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-6 lg:px-8 py-8">
      <div className="lg:col-span-8 xl:col-span-9">
        <DashboardClient user={user} />
      </div>
      <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
        <RightSidebar />
      </aside>
    </div>
  );
}
