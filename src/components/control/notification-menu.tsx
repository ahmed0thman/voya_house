"use client";

import { useRouter } from "next/navigation";
import { BellIcon, BikeIcon, CheckCheckIcon, ShoppingBagIcon, UtensilsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useOrderNotifications, describeNotification } from "@/hooks/use-order-notifications";
import { formatRelativeTime } from "./order-ticket";
import { cn } from "@/lib/utils";
import type { NotificationTab, OrderNotification } from "@/lib/notifications";

const TAB_ICON = {
  table: UtensilsIcon,
  takeaway: ShoppingBagIcon,
  delivery: BikeIcon,
} satisfies Record<NotificationTab, typeof BellIcon>;

/**
 * Lives in the header on every control page, so an order that lands while
 * someone is deep in the menu editor still surfaces. Selecting one navigates to
 * the orders board with the target in the URL — the board is a different tree
 * entirely, and a query string carries the intent across a page change more
 * honestly than shared state would.
 */
export function NotificationMenu() {
  const router = useRouter();

  // Navigation only — the hook clears the entry itself when a toast is opened.
  const navigateTo = (entry: OrderNotification) => {
    const params = new URLSearchParams({ tab: entry.tab });
    if (entry.tableNumber !== null) params.set("table", String(entry.tableNumber));
    router.push(`/control/orders?${params.toString()}`);
  };

  const { notifications, unreadCount, markAllRead, markRead } =
    useOrderNotifications(navigateTo);

  const open = (entry: OrderNotification) => {
    markRead(entry.id);
    navigateTo(entry);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" className="relative" />}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications, none unread"
        }
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white tabular-nums">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <CheckCheckIcon />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No orders yet today.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((entry) => {
              const Icon = TAB_ICON[entry.tab];
              return (
                <DropdownMenuItem
                  key={entry.id}
                  onClick={() => open(entry)}
                  className={cn(
                    "flex items-start gap-2.5 px-3 py-2.5",
                    !entry.read && "bg-destructive/5",
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("truncate text-sm", !entry.read && "font-medium")}>
                      New order — {describeNotification(entry)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </span>
                  {!entry.read && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
