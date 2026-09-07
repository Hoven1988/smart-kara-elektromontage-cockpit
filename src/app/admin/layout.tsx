import { ClientTreeNav } from "@/components/client-tree-nav";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";
import { DevFooter } from "@/components/dev-footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="flex w-64 flex-col border-r border-border">
        <AdminSidebarNav clientTree={<ClientTreeNav />} />
      </aside>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex flex-col">{children}</main>
        <DevFooter />
      </div>
    </div>
  );
}
