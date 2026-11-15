"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeadlineCheckbox({
  checked,
  onToggle,
  label = "Erledigt",
}: {
  checked: boolean;
  onToggle: (done: boolean) => Promise<void>;
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticChecked, setOptimisticChecked] = useState(checked);

  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-silver">
      <input
        type="checkbox"
        checked={optimisticChecked}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setOptimisticChecked(next);
          startTransition(async () => {
            await onToggle(next);
            router.refresh();
          });
        }}
        className="h-4 w-4 rounded border-border accent-copper"
      />
      {label}
    </label>
  );
}
