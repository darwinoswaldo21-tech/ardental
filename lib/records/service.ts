import { createClient } from "@supabase/supabase-js";
import type { PrescriptionInput } from "@/lib/validations/prescriptions";

type PatientImageInput = {
  patient_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  category: "image" | "xray" | "document";
  taken_at?: string | null;
  notes?: string | null;
  uploaded_by?: string | null;
};

type PrescriptionInsert = PrescriptionInput & {
  sent_via_whatsapp?: boolean | null;
  printed?: boolean | null;
  prescribed_by?: string | null;
};

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role env vars missing");
  }
  return createClient(url, serviceKey);
}

export async function listPatientImages(patientId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("patient_images")
    .select(
      "id, patient_id, cloudinary_url, cloudinary_public_id, category, taken_at, notes, uploaded_by, created_at"
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los archivos.");
  }

  return data ?? [];
}

export async function getPatientImageById(id: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("patient_images")
    .select(
      "id, patient_id, cloudinary_url, cloudinary_public_id, category, taken_at, notes, uploaded_by, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar el archivo.");
  }

  return data ?? null;
}

export async function createPatientImage(input: PatientImageInput) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("patient_images")
    .insert({
      patient_id: input.patient_id,
      cloudinary_url: input.cloudinary_url,
      cloudinary_public_id: input.cloudinary_public_id,
      category: input.category,
      taken_at: input.taken_at ?? null,
      notes: input.notes ?? null,
      uploaded_by: input.uploaded_by ?? null,
    })
    .select(
      "id, patient_id, cloudinary_url, cloudinary_public_id, category, taken_at, notes, uploaded_by, created_at"
    )
    .single();

  if (error) {
    return { ok: false, message: error.message || "No se pudo guardar el archivo." };
  }

  return { ok: true, image: data };
}

export async function deletePatientImageById(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("patient_images")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("No se pudo eliminar el archivo.");
  }
}

export async function listPrescriptions(patientId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(
      "id, patient_id, appointment_id, items, general_notes, sent_via_whatsapp, printed, prescribed_by, created_at"
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar las recetas.");
  }

  return data ?? [];
}

export async function createPrescription(input: PrescriptionInsert) {
  const supabase = createServiceClient();
  const items = input.items.map((item) => ({
    name: item.name,
    dosage: item.dosage || null,
    instructions: item.instructions || null,
    duration: item.duration || null,
  }));

  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: input.patient_id,
      appointment_id: input.appointment_id || null,
      items,
      general_notes: input.general_notes || null,
      sent_via_whatsapp: input.sent_via_whatsapp ?? false,
      printed: input.printed ?? false,
      prescribed_by: input.prescribed_by ?? null,
    })
    .select(
      "id, patient_id, appointment_id, items, general_notes, sent_via_whatsapp, printed, prescribed_by, created_at"
    )
    .single();

  if (error) {
    return { ok: false, message: error.message || "No se pudo crear la receta." };
  }

  return { ok: true, prescription: data };
}
