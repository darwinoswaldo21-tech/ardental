import { NextResponse } from "next/server";
import { getAppointmentsForWeek } from "@/lib/appointments/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Parámetro date requerido (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  const baseDate = new Date(date);
  if (Number.isNaN(baseDate.getTime())) {
    return NextResponse.json(
      { error: "Fecha inválida." },
      { status: 400 }
    );
  }

  const data = await getAppointmentsForWeek(baseDate);
  return NextResponse.json({ data });
}
