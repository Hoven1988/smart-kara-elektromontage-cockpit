import { createCustomer } from "@/actions/customers";
import { CustomerForm } from "@/components/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Neuer Kunde</h1>
      <CustomerForm action={createCustomer} submitLabel="Kunde anlegen" />
    </div>
  );
}
