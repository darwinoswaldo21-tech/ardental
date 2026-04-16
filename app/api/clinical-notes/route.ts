import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clinicalNoteSchema } from "@/lib/validations/clinical-notes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");

  if (!patientId) {
    return NextResponse.json(
      { error: "patient_id requerido" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
    const { data, error } = await supabase
      .from("clinical_notes")
      .select("id, patient_id, date, content, vital_signs, written_by, created_at")
      .eq("patient_id", patientId)
      .order("date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las notas clínicas" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const parsed = clinicalNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("clinical_notes")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id });
}
