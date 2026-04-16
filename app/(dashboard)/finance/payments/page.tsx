import { createClient } from "@/lib/supabase/server";
import PaymentsClient from "@/components/finance/PaymentsClient";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, id_number, phone")
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, patient_id, invoice_number, total, status")
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, patient_id, invoice_id, treatment_id, amount, payment_method, concept, payment_date, reference, notes, created_at, patients(first_name,last_name,id_number,phone), invoices(invoice_number)"
    )
    .order("created_at", { ascending: false });

  const { data: treatments } = await supabase
    .from("orthodontic_treatments")
    .select("id, patient_id, status, appliance_type, start_date")
    .order("created_at", { ascending: false });

  return (
    <PaymentsClient
      patients={patients ?? []}
      invoices={invoices ?? []}
      treatments={treatments ?? []}
      payments={payments ?? []}
    />
  );
}
