import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/project-status";

type CustomerOption = { id: number; name: string };

type ProjectFormValues = {
  title?: string;
  customer_id?: number | null;
  address?: string | null;
  status?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function ProjectForm({
  action,
  customers,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  customers: CustomerOption[];
  defaultValues?: ProjectFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="title">
          Titel
        </label>
        <input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          required
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="customer_id">
          Kunde
        </label>
        <select
          id="customer_id"
          name="customer_id"
          defaultValue={defaultValues?.customer_id ?? ""}
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
        >
          <option value="">– Kein Kunde –</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "geplant"}
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
        >
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PROJECT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="address">
          Adresse / Baustelle
        </label>
        <input
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-silver" htmlFor="start_date">
            Start
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={defaultValues?.start_date ?? ""}
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm text-silver" htmlFor="end_date">
            Ende
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={defaultValues?.end_date ?? ""}
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="description">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
        />
      </div>

      <button
        type="submit"
        className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
