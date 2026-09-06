"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded border border-border px-3 py-1.5 text-sm text-silver transition-colors hover:border-copper hover:text-copper-light"
    >
      Abmelden
    </button>
  );
}
