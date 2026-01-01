
import { type ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-secondary/30">
      <main>{children}</main>
    </div>
  );
}
