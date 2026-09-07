"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function SaveToastInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const saved = searchParams.get("saved") === "1";

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => {
      router.replace(pathname);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [saved, pathname, router]);

  if (!saved) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded bg-copper px-4 py-2 text-sm font-medium text-background shadow-lg">
      Gespeichert
    </div>
  );
}

export function SaveToast() {
  return (
    <Suspense fallback={null}>
      <SaveToastInner />
    </Suspense>
  );
}
