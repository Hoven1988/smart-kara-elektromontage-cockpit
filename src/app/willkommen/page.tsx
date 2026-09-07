import Link from "next/link";
import { getCurrentUser, homePathForRole } from "@/lib/auth";

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-2 text-3xl font-bold text-silver-light">
        Herzlich willkommen, {user.name}
      </h1>
      <p className="mb-8 text-silver">{today}</p>
      <Link
        href={homePathForRole(user.role)}
        className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-copper-light"
      >
        Zum KARA Cockpit
      </Link>
    </div>
  );
}
