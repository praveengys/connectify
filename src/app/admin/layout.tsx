
import AdminAuthProvider from '@/components/admin/AdminAuthProvider';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthProvider>
  );
}
