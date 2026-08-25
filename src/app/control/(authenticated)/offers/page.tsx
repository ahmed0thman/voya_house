import { requireAdmin } from "@/lib/dal";
import { OffersTable } from "@/components/control/offers-table";

export default async function ControlOffersPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Offer codes</h1>
        <p className="text-sm text-muted-foreground">
          Discount codes customers can redeem, with a valid date range.
        </p>
      </div>
      <OffersTable />
    </div>
  );
}
