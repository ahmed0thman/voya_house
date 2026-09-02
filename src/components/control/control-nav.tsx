"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import { NotificationMenu } from "./notification-menu";

const NAV_ITEMS = [
  { href: "/control", label: "Dashboard", adminOnly: true },
  { href: "/control/orders", label: "Orders", adminOnly: false },
  { href: "/control/menu", label: "Menu", adminOnly: true },
  { href: "/control/tables", label: "Tables", adminOnly: true },
  { href: "/control/offers", label: "Offers", adminOnly: true },
  { href: "/control/users", label: "Users", adminOnly: true },
  { href: "/control/settings", label: "Settings", adminOnly: true },
] as const;

const ROLE_LABEL = { ADMIN: "Admin", STAFF: "Staff" } as const;

export function ControlNav({ user }: { user: { name: string; role: "ADMIN" | "STAFF" } }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user.role === "ADMIN",
  );

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.push("/control/login"),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <nav className="flex items-center gap-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/control"
              ? pathname === "/control"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-s ps-4">
        <NotificationMenu />
        <span className="text-sm text-muted-foreground">
          {user.name}{" "}
          <span className="text-xs text-muted-foreground/70">
            ({ROLE_LABEL[user.role]})
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={logout.isPending}
          onClick={handleLogout}
        >
          <LogOutIcon />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </div>
  );
}
