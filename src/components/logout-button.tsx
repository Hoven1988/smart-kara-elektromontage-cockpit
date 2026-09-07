"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ variant = "button" }: { variant?: "button" | "link" }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (variant === "link") {
    return (
      <button
        onClick={handleLogout}
        className="rounded px-3 py-2 text-left text-sm text-silver transition-colors hover:bg-card hover:text-silver-light"
      >
        Abmelden
      </button>
    );
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
