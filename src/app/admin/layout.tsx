import { ClientTreeNav } from "@/components/client-tree-nav";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";
import { SaveToast } from "@/components/save-toast";

// Diese Seiten lesen bei jedem Aufruf frische Daten aus der Datenbank -
// nie statisch vorab berechnen (würde beim Bauen live DB-Zugriffe
// auslösen, die am Supabase-Pooler scheitern können).
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="print:hidden">
        <AdminSidebarNav clientTree={<ClientTreeNav />} />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex flex-col">{children}</main>
      </div>
      <div className="print:hidden">
        <SaveToast />
      </div>
    </div>
  );
}
