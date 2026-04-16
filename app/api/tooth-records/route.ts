import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toothRecordSchema } from "@/lib/validations/tooth-records";

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
    .from("tooth_records")
    .select("id, patient_id, tooth_number, condition, affected_faces, notes")
    .eq("patient_id", patientId)
    .order("tooth_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const parsed = toothRecordSchema.safeParse(body);

  if (!parsed.success) {
    console.error("[tooth-records] validation error:", parsed.error.flatten());
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data.records.map((record) => ({
    patient_id: parsed.data.patient_id,
    tooth_number: record.tooth_number,
    condition: record.condition,
    affected_faces: record.affected_faces ?? null,
    notes: record.notes ?? null,
  }));

  const { error } = await supabase
    .from("tooth_records")
    .upsert(payload, { onConflict: "patient_id,tooth_number" });

  if (error) {
    console.error("[tooth-records] db error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
