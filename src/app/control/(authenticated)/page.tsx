import { requireAdmin } from "@/lib/dal";
import { DashboardOverview } from "@/components/control/dashboard-overview";

export default async function ControlDashboardPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A snapshot of the menu catalog across all three houses.
        </p>
      </div>
      <DashboardOverview />
    </div>
  );
}
