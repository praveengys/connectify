
import { type ReactNode } from 'react';
import Header from '@/components/Header';
import { AuthProvider } from '@/hooks/use-auth';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
    </div>
  );
}
