import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patientSchema } from "@/lib/validations/patients";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await request.json();
  const parsed = patientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("patients")
    .update(parsed.data)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el paciente" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
