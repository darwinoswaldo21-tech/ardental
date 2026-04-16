import { createClient } from "@supabase/supabase-js";
import type {
  BracketRecordsPayload,
  OrthodonticTreatmentInput,
  OrthodonticAdjustmentInput,
} from "@/lib/validations/orthodontics";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role env vars missing");
  }
  return createClient(url, serviceKey);
}

export async function createOrthodonticTreatment(
  input: OrthodonticTreatmentInput
) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orthodontic_treatments")
    .insert(input)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message || "No se pudo crear el tratamiento.",
    };
  }

  return { ok: true, id: data.id };
}

export async function getOrthodonticTreatmentByPatientId(patientId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orthodontic_treatments")
    .select(
      "id, patient_id, molar_class, canine_class, overjet, overbite, diagnosis_notes, appliance_type, planned_extractions, treatment_objectives, status, start_date, estimated_end_date, actual_end_date, retainer_type, retainer_notes, total_cost, monthly_fee"
    )
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) {
    return { ok: false, message: "No se pudo cargar el tratamiento." };
  }

  return { ok: true, treatment: data ?? null };
}

export async function updateOrthodonticTreatment(
  id: string,
  input: OrthodonticTreatmentInput
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orthodontic_treatments")
    .update(input)
    .eq("id", id);

  if (error) {
    return { ok: false, message: "No se pudo actualizar el tratamiento." };
  }

  return { ok: true };
}

export async function getBracketRecordsByTreatmentId(treatmentId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("bracket_records")
    .select("tooth_number, bracket_brand, placement_date, notes")
    .eq("treatment_id", treatmentId);

  if (error) {
    return { ok: false, message: "No se pudieron cargar los brackets." };
  }

  return { ok: true, records: data ?? [] };
}

export async function replaceBracketRecords(payload: BracketRecordsPayload) {
  const supabase = createServiceClient();
  const { treatment_id, records } = payload;

  const { data: existing, error: existingError } = await supabase
    .from("bracket_records")
    .select("tooth_number")
    .eq("treatment_id", treatment_id);

  if (existingError) {
    return { ok: false, message: "No se pudo leer los brackets actuales." };
  }

  const existingTeeth = new Set(
    (existing ?? []).map((item: { tooth_number: number }) => item.tooth_number)
  );
  const incomingTeeth = new Set(records.map((item) => item.tooth_number));
  const toDelete = Array.from(existingTeeth).filter(
    (tooth) => !incomingTeeth.has(tooth)
  );

  if (records.length === 0 && existingTeeth.size > 0) {
    const { error } = await supabase
      .from("bracket_records")
      .delete()
      .eq("treatment_id", treatment_id);
    if (error) {
      return { ok: false, message: "No se pudo limpiar los brackets." };
    }
    return { ok: true };
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("bracket_records")
      .delete()
      .eq("treatment_id", treatment_id)
      .in("tooth_number", toDelete);
    if (error) {
      return { ok: false, message: "No se pudo eliminar brackets." };
    }
  }

  if (records.length > 0) {
    const { error } = await supabase
      .from("bracket_records")
      .upsert(
        records.map((item) => ({
          treatment_id,
          tooth_number: item.tooth_number,
          bracket_brand: item.bracket_brand ?? null,
          placement_date: item.placement_date ?? null,
          notes: item.notes ?? null,
        })),
        { onConflict: "treatment_id,tooth_number" }
      );
    if (error) {
      return { ok: false, message: "No se pudo guardar los brackets." };
    }
  }

  return { ok: true };
}

export async function createOrthodonticAdjustment(
  input: OrthodonticAdjustmentInput
) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orthodontic_adjustments")
    .insert(input)
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: "No se pudo crear el ajuste." };
  }

  return { ok: true, id: data.id };
}

export async function getOrthodonticAdjustmentsByTreatmentId(
  treatmentId: string
) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orthodontic_adjustments")
    .select(
      "id, adjustment_date, upper_arch, lower_arch, elastics, observations, next_appointment_notes, appointment_id"
    )
    .eq("treatment_id", treatmentId)
    .order("adjustment_date", { ascending: false });

  if (error) {
    return { ok: false, message: "No se pudieron cargar los ajustes." };
  }

  return { ok: true, adjustments: data ?? [] };
}

export async function getLatestOrthodonticAppointmentByPatientId(
  patientId: string
) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, scheduled_at")
    .eq("patient_id", patientId)
    .eq("type", "ajuste_ortodoncia")
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, message: "No se pudo cargar la cita." };
  }

  return { ok: true, appointment: data ?? null };
}
