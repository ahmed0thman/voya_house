import { requireAdmin } from "@/lib/dal";
import { TablesTable } from "@/components/control/tables-table";

export default async function ControlTablesPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Tables</h1>
        <p className="text-sm text-muted-foreground">
          The table numbers available in the dining area.
        </p>
      </div>
      <TablesTable />
    </div>
  );
}
