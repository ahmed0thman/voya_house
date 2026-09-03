import { requireAdmin } from "@/lib/dal";
import { SystemStatus } from "@/components/control/system-status";
import { WhatsappSettingsCard } from "@/components/control/whatsapp-settings-card";

export default async function ControlSettingsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          System configuration and status.
        </p>
      </div>
      <WhatsappSettingsCard />
      <SystemStatus />
    </div>
  );
}
