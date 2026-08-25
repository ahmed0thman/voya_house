import { requireAdmin } from "@/lib/dal";
import { UsersTable } from "@/components/control/users-table";

export default async function ControlUsersPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Admin and staff accounts.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
