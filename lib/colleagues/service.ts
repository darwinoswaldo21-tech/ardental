import { createClient } from "@supabase/supabase-js";
import type {
  ColleagueFeeInput,
  ColleagueInput,
  ColleagueUpdateInput,
} from "@/lib/validations/colleagues";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role env vars missing");
  }
  return createClient(url, serviceKey);
}

export async function listColleagues() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("colleagues")
    .select(
      "id, full_name, specialty_id, phone, email, notes, is_active, created_at, specialties(id, name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los colegas.");
  }

  return data ?? [];
}

export async function createColleague(input: ColleagueInput) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("colleagues")
    .insert({
      full_name: input.full_name,
      specialty_id: input.specialty_id,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      is_active: input.is_active ?? true,
    })
    .select(
      "id, full_name, specialty_id, phone, email, notes, is_active, created_at, specialties(id, name)"
    )
    .single();

  if (error) {
    return { ok: false, message: error.message || "No se pudo crear el colega." };
  }

  return { ok: true, colleague: data };
}

export async function updateColleague(input: ColleagueUpdateInput) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("colleagues")
    .update({
      full_name: input.full_name,
      specialty_id: input.specialty_id,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      is_active: input.is_active ?? true,
    })
    .eq("id", input.id)
    .select(
      "id, full_name, specialty_id, phone, email, notes, is_active, created_at, specialties(id, name)"
    )
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message || "No se pudo actualizar el colega.",
    };
  }

  return { ok: true, colleague: data };
}

export async function listColleagueFees(colleagueId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("colleague_fees")
    .select(
      "id, colleague_id, amount, payment_date, payment_method, notes, created_at"
    )
    .eq("colleague_id", colleagueId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los pagos.");
  }

  return data ?? [];
}

export async function createColleagueFee(input: ColleagueFeeInput) {
  const supabase = createServiceClient();
  const paymentDate =
    input.payment_date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("colleague_fees")
    .insert({
      colleague_id: input.colleague_id,
      amount: input.amount,
      payment_date: paymentDate,
      payment_method: input.payment_method,
      notes: input.notes ?? null,
    })
    .select(
      "id, colleague_id, amount, payment_date, payment_method, notes, created_at"
    )
    .single();

  if (error) {
    return { ok: false, message: error.message || "No se pudo registrar el pago." };
  }

  return { ok: true, fee: data };
}
