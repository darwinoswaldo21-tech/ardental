import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patientMedicalSchema } from "@/lib/validations/patient-medical";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID de paciente requerido" },
      { status: 400 }
    );
  }
  const supabase = await createClient();
  const body = await request.json();
  const parsed = patientMedicalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  console.log("[patients/medical] id:", id);
  console.log("[patients/medical] payload:", parsed.data);

  const { data, error } = await supabase
    .from("patients")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Paciente no encontrado para actualizar" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
