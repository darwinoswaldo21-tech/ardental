import { NextResponse } from "next/server";
import { getAccountStatement } from "@/lib/finance/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json(
      { error: "Paciente requerido" },
      { status: 400 }
    );
  }

  try {
    const data = await getAccountStatement(patientId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el estado de cuenta." },
      { status: 500 }
    );
  }
}
