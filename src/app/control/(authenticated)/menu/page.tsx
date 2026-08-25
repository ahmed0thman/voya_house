import { requireAdmin } from "@/lib/dal";
import { MenuBoard } from "@/components/control/menu-board";

export default async function ControlMenuPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Menu</h1>
        <p className="text-sm text-muted-foreground">
          Manage categories and items across the three houses.
        </p>
      </div>
      <MenuBoard />
    </div>
  );
}
