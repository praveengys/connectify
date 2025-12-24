'use client';

import { type ReactNode } from 'react';
import Header from '@/components/Header';

// NOTE: Auth check is temporarily disabled for development.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  // const { user, loading } = useAuth();
  // const router = useRouter();
  //
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, loading, router]);
  //
  // if (loading || !user) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center bg-background">
  //       <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //       <p className="sr-only">Loading...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
    </div>
  );
}
