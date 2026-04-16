import { NextResponse } from "next/server";
import { appointmentUpdateSchema } from "@/lib/validations/appointments";
import { updateAppointment } from "@/lib/appointments/service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  console.log("[PATCH /api/appointments] id:", id);

  const body = await request.json();

  const parsed = appointmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos" },
      { status: 400 }
    );
  }

  const result = await updateAppointment(id, parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo actualizar la cita" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
