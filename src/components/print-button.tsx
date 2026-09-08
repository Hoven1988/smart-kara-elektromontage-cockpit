"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded border border-border px-4 py-2 text-sm text-silver-light transition-colors hover:border-copper hover:text-copper-light"
    >
      {label}
    </button>
  );
}
