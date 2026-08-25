import { requireUser } from "@/lib/dal";
import { ControlNav } from "@/components/control/control-nav";

export default async function AuthenticatedControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <span className="font-medium">Voya Control Board</span>
          <ControlNav user={user} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </>
  );
}
