
import ModeratorAuthProvider from '@/components/moderator/ModeratorAuthProvider';
import ModeratorLayout from '@/components/moderator/ModeratorLayout';

export default function ModeratorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeratorAuthProvider>
      <ModeratorLayout>{children}</ModeratorLayout>
    </ModeratorAuthProvider>
  );
}
