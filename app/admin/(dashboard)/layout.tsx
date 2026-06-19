import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar email={session.email} name={session.name} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-[var(--nrf-off-white)]">
        {children}
      </main>
    </div>
  );
}
