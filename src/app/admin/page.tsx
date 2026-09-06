import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-sm text-silver">Angemeldet als</p>
          <p className="font-medium text-silver-light">{user?.name} (Admin)</p>
        </div>
        <LogoutButton />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-2 text-xl font-semibold text-silver-light">Dashboard</h1>
        <p className="max-w-sm text-sm text-silver">
          Hier entstehen bald Kunden-, Auftrags- und Einsatzplanung sowie die
          Zeitübersicht.
        </p>
      </main>
    </div>
  );
}
