import { NextResponse } from "next/server";
import { getLatestOrthodonticAppointmentByPatientId } from "@/lib/orthodontics/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json(
      { error: "Paciente requerido" },
      { status: 400 }
    );
  }

  const result = await getLatestOrthodonticAppointmentByPatientId(patientId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo cargar la cita" },
      { status: 400 }
    );
  }

  return NextResponse.json({ appointment: result.appointment });
}
