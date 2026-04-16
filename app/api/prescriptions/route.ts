import { NextResponse } from "next/server";
import { prescriptionSchema } from "@/lib/validations/prescriptions";
import {
  createPrescription,
  listPrescriptions,
} from "@/lib/records/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");

  if (!patientId) {
    return NextResponse.json(
      { error: "patient_id requerido" },
      { status: 400 }
    );
  }

  try {
    const data = await listPrescriptions(patientId);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las recetas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = prescriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createPrescription(parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "No se pudo crear la receta." },
        { status: 400 }
      );
    }

    return NextResponse.json({ prescription: result.prescription });
  } catch (error) {
    return NextResponse.json(
      { error: "Error inesperado al crear la receta" },
      { status: 500 }
    );
  }
}
