'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [router, user, loading]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      <p>Loading...</p>
    </div>
  );
}
