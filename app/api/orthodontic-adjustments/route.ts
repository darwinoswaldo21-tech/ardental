import { NextResponse } from "next/server";
import {
  orthodonticAdjustmentSchema,
} from "@/lib/validations/orthodontics";
import {
  createOrthodonticAdjustment,
  getOrthodonticAdjustmentsByTreatmentId,
} from "@/lib/orthodontics/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const treatmentId = searchParams.get("treatmentId");

  if (!treatmentId) {
    return NextResponse.json(
      { error: "Tratamiento requerido" },
      { status: 400 }
    );
  }

  const result = await getOrthodonticAdjustmentsByTreatmentId(treatmentId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudieron cargar los ajustes" },
      { status: 400 }
    );
  }

  return NextResponse.json({ adjustments: result.adjustments });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = orthodonticAdjustmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createOrthodonticAdjustment(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo crear el ajuste" },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: result.id });
}
