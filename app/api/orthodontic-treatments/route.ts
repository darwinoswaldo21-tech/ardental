import { NextResponse } from "next/server";
import { orthodonticTreatmentSchema } from "@/lib/validations/orthodontics";
import {
  createOrthodonticTreatment,
  getOrthodonticTreatmentByPatientId,
  updateOrthodonticTreatment,
} from "@/lib/orthodontics/service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = orthodonticTreatmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createOrthodonticTreatment(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo crear el tratamiento" },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: result.id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json(
      { error: "Paciente requerido" },
      { status: 400 }
    );
  }

  const result = await getOrthodonticTreatmentByPatientId(patientId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo cargar el tratamiento" },
      { status: 400 }
    );
  }

  return NextResponse.json({ treatment: result.treatment });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = orthodonticTreatmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = body ?? {};
  if (!id) {
    return NextResponse.json({ error: "Id requerido" }, { status: 400 });
  }

  const result = await updateOrthodonticTreatment(id, parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo actualizar el tratamiento" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
