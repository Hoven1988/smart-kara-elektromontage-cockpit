"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Anmeldung fehlgeschlagen.");
        return;
      }
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <Image
        src="/logo.jpg"
        alt="KARA Elektromontage & Service"
        width={280}
        height={90}
        priority
        className="mb-10 h-auto w-full max-w-[240px]"
      />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="mb-6 text-lg font-semibold text-silver-light">Anmelden</h1>

        <label className="mb-1 block text-sm text-silver" htmlFor="username">
          Benutzername
        </label>
        <input
          id="username"
          className="mb-4 w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="mb-1 block text-sm text-silver" htmlFor="password">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          className="mb-6 w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-copper py-2 font-medium text-background transition-colors hover:bg-copper-light disabled:opacity-60"
        >
          {loading ? "Wird geprüft…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
