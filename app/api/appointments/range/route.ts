import { NextResponse } from "next/server";
import { getAppointmentsByRange } from "@/lib/appointments/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "Parámetros start y end requeridos." },
      { status: 400 }
    );
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: "Rango de fechas inválido." },
      { status: 400 }
    );
  }

  const data = await getAppointmentsByRange({
    start: startDate,
    end: endDate,
  });

  return NextResponse.json({ data });
}
