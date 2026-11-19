"use client";

import { useEffect, useState } from "react";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LiveClock({ startedAt }: { startedAt: string }) {
  const start = new Date(startedAt).getTime();
  const [elapsed, setElapsed] = useState(() => Date.now() - start);

  useEffect(() => {
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [start]);

  return <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>;
}
