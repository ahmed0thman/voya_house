"use client";

import { useCallback, useState } from "react";
import { BikeIcon, UtensilsIcon, ShoppingBagIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTableSessions, useOrdersByType } from "@/hooks/use-orders";
import { useNewOrderNotifications, type OrderTab } from "@/hooks/use-new-order-notifications";
import { TableOrdersPanel, type TableJumpSignal } from "./table-orders-panel";
import { TypeOrdersPanel } from "./type-orders-panel";

function TabCount({ count }: { count: number }) {
  if (count === 0) return null;
  return <Badge variant="secondary">{count}</Badge>;
}

export function OrdersBoard() {
  const [activeTab, setActiveTab] = useState<OrderTab>("table");
  const [jumpSignal, setJumpSignal] = useState<TableJumpSignal | null>(null);

  const tableSessions = useTableSessions();
  const takeaway = useOrdersByType("TAKEAWAY");
  const delivery = useOrdersByType("DELIVERY");

  const tableTicketCount =
    tableSessions.data?.reduce(
      (sum, session) => sum + session.orders.filter((o) => o.status !== "SERVED").length,
      0,
    ) ?? 0;

  const handleJump = useCallback((tab: OrderTab, tableNumber?: number) => {
    setActiveTab(tab);
    if (tab === "table" && tableNumber !== undefined) {
      setJumpSignal({ tableNumber, nonce: Date.now() });
    }
  }, []);

  useNewOrderNotifications(handleJump);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderTab)}>
      <TabsList>
        <TabsTrigger value="table">
          <UtensilsIcon />
          On Table
          <TabCount count={tableTicketCount} />
        </TabsTrigger>
        <TabsTrigger value="takeaway">
          <ShoppingBagIcon />
          Takeaway
          <TabCount count={takeaway.data?.length ?? 0} />
        </TabsTrigger>
        <TabsTrigger value="delivery">
          <BikeIcon />
          Delivery
          <TabCount count={delivery.data?.length ?? 0} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="table" className="mt-4">
        <TableOrdersPanel jumpSignal={jumpSignal} />
      </TabsContent>
      <TabsContent value="takeaway" className="mt-4">
        <TypeOrdersPanel
          type="TAKEAWAY"
          emptyIcon={ShoppingBagIcon}
          emptyLabel="No takeaway orders yet."
        />
      </TabsContent>
      <TabsContent value="delivery" className="mt-4">
        <TypeOrdersPanel type="DELIVERY" emptyIcon={BikeIcon} emptyLabel="No delivery orders yet." />
      </TabsContent>
    </Tabs>
  );
}
