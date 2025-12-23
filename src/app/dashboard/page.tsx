'use client';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // The layout now handles the main loading state, but this check is a good fallback.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return <DashboardClient user={user} />;
}