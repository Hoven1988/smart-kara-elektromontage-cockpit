import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function MonteurLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-wide text-copper-light">
          KARA Cockpit
        </Link>
        <div className="flex items-center gap-4">
          <p className="text-sm text-silver-light">{user?.name}</p>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <nav className="flex border-t border-border">
        <Link
          href="/"
          className="flex-1 px-4 py-3 text-center text-sm text-silver hover:text-silver-light"
        >
          Meine Aufträge
        </Link>
        <Link
          href="/zeiten"
          className="flex-1 border-l border-border px-4 py-3 text-center text-sm text-silver hover:text-silver-light"
        >
          Meine Zeiten
        </Link>
      </nav>
    </div>
  );
}
