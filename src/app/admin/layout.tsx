import { getCurrentUser } from "@/lib/auth";
import { ClientTreeNav } from "@/components/client-tree-nav";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1">
      <aside className="flex w-64 flex-col border-r border-border py-6">
        <AdminSidebarNav clientTree={<ClientTreeNav />} userName={user?.name ?? ""} />
      </aside>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
