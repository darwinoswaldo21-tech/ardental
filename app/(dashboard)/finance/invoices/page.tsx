import { createClient } from "@/lib/supabase/server";
import InvoicesClient from "@/components/finance/InvoicesClient";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, id_number, phone")
    .order("created_at", { ascending: false });

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, base_price, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: budgets } = await supabase
    .from("budgets")
    .select(
      "id, patient_id, items, subtotal, discount, total, status, valid_until, created_at"
    )
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, patient_id, appointment_id, budget_id, invoice_number, items, subtotal, discount, total, status, created_at, patients(first_name,last_name,id_number,phone)"
    )
    .order("created_at", { ascending: false });

  return (
    <InvoicesClient
      patients={patients ?? []}
      services={services ?? []}
      budgets={budgets ?? []}
      invoices={invoices ?? []}
    />
  );
}
