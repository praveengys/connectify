
import { type ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <main className="flex-grow">{children}</main>
    </div>
  );
}
