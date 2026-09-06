type CustomerFormValues = {
  name?: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export function CustomerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: CustomerFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <Field label="Name" name="name" defaultValue={defaultValues?.name} required />
      <Field
        label="Ansprechpartner"
        name="contact_person"
        defaultValue={defaultValues?.contact_person ?? ""}
      />
      <Field label="Telefon" name="phone" defaultValue={defaultValues?.phone ?? ""} />
      <Field label="E-Mail" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
      <Field label="Adresse" name="address" defaultValue={defaultValues?.address ?? ""} />
      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="notes">
          Notizen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
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

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-silver" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
      />
    </div>
  );
}
