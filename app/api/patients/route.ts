import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patientSchema } from "@/lib/validations/patients";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const parsed = patientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("patients")
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
