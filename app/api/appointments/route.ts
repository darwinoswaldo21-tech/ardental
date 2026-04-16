import { NextResponse } from "next/server";
import { appointmentSchema } from "@/lib/validations/appointments";
import { createAppointment } from "@/lib/appointments/service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createAppointment(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo crear la cita" },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: result.id });
}
