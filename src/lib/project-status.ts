export const PROJECT_STATUSES = [
  "geplant",
  "in_arbeit",
  "pausiert",
  "abgeschlossen",
  "storniert",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  geplant: "Geplant",
  in_arbeit: "In Arbeit",
  pausiert: "Pausiert",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
};

export function parseProjectStatus(value: string | null | undefined): ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as ProjectStatus)
    : "geplant";
}
