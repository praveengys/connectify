'use client';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    // This is handled by the layout, but as a fallback.
    return null;
  }
  
  return <DashboardClient user={user} />;
}
