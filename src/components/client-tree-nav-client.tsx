"use client";

import Link from "next/link";
import { useState } from "react";

type Customer = {
  id: number;
  name: string;
  projects: Array<{ id: number; title: string }>;
};

export function ClientTreeNavClient({
  customers,
  unassigned,
}: {
  customers: Customer[];
  unassigned: Array<{ id: number; title: string }>;
}) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/admin/kunden"
        className="rounded px-3 py-2 text-sm text-silver transition-colors hover:bg-card hover:text-silver-light"
      >
        Auftraggeber
      </Link>
      <div className="flex flex-col">
        {customers.map((customer) => {
          const isOpen = openIds.has(customer.id);
          return (
            <div key={customer.id}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => toggle(customer.id)}
                  aria-expanded={isOpen}
                  className="flex w-5 shrink-0 items-center justify-center text-silver transition-transform"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                >
                  ▸
                </button>
                <Link
                  href={`/admin/kunden/${customer.id}`}
                  className="block flex-1 truncate rounded px-1 py-1.5 text-sm text-silver-light transition-colors hover:bg-card"
                >
                  {customer.name}
                </Link>
              </div>
              {isOpen && (
                <div className="ml-3 flex flex-col border-l border-border pl-3">
                  {customer.projects.length === 0 ? (
                    <span className="px-2 py-1 text-xs text-silver">Keine Projekte</span>
                  ) : (
                    customer.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/admin/auftraege/${project.id}`}
                        className="truncate rounded px-2 py-1 text-xs text-silver transition-colors hover:bg-card hover:text-silver-light"
                      >
                        {project.title}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <div>
          <p className="px-3 py-1.5 text-sm text-silver">Ohne Auftraggeber</p>
          <div className="ml-3 flex flex-col border-l border-border pl-3">
            {unassigned.map((project) => (
              <Link
                key={project.id}
                href={`/admin/auftraege/${project.id}`}
                className="truncate rounded px-2 py-1 text-xs text-silver transition-colors hover:bg-card hover:text-silver-light"
              >
                {project.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
