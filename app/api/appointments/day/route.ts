import { NextResponse } from "next/server";
import { getAppointmentsForDay } from "@/lib/appointments/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Parametro date requerido (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  const [year, month, day] = date.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return NextResponse.json({ error: "Fecha invalida." }, { status: 400 });
  }

  const baseDate = new Date(year, month - 1, day);
  const data = await getAppointmentsForDay(baseDate);
  return NextResponse.json({ data });
}
