import { requireUser } from "@/lib/dal";
import { OrdersBoard } from "@/components/control/orders-board";

export default async function ControlOrdersPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">Incoming orders from the dining area.</p>
      </div>

      <OrdersBoard />
    </div>
  );
}
