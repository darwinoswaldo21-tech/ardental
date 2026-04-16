import { createClient } from "@/lib/supabase/server";
import BudgetsClient from "@/components/finance/BudgetsClient";

export default async function BudgetsPage() {
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
      "id, patient_id, items, subtotal, discount, total, status, valid_until, notes, created_at, patients(first_name,last_name,id_number,phone)"
    )
    .order("created_at", { ascending: false });

  return (
    <BudgetsClient
      patients={patients ?? []}
      services={services ?? []}
      budgets={budgets ?? []}
    />
  );
}
