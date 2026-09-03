import { requireAdmin } from "@/lib/dal";
import { ContactSubjectsPanel } from "@/components/control/contact-subjects-panel";
import { ContactMessagesTable } from "@/components/control/contact-messages-table";

export default async function ControlContactPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Contact</h1>
        <p className="text-sm text-muted-foreground">
          Manage the contact form&apos;s subjects and read incoming messages.
        </p>
      </div>
      <ContactSubjectsPanel />
      <ContactMessagesTable />
    </div>
  );
}
