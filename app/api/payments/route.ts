import { NextResponse } from "next/server";
import { paymentSchema } from "@/lib/validations/finance";
import { createPayment, listPayments } from "@/lib/finance/service";

export async function GET() {
  try {
    const data = await listPayments();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los pagos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invÃ¡lidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createPayment(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo registrar el pago." },
      { status: 400 }
    );
  }

  return NextResponse.json({ payment: result.payment });
}
