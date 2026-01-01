
import UserTable from "@/components/admin/UserTable";

export default function AdminUsersPage() {
  return (
    <div>
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        <UserTable />
    </div>
  );
}
