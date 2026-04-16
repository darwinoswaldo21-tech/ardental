import { NextResponse } from "next/server";
import {
  invoiceSchema,
  invoiceUpdateSchema,
} from "@/lib/validations/finance";
import {
  createInvoice,
  listInvoices,
  updateInvoice,
} from "@/lib/finance/service";

export async function GET() {
  try {
    const data = await listInvoices();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las facturas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = invoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invÃ¡lidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createInvoice(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo crear la factura." },
      { status: 400 }
    );
  }

  return NextResponse.json({ invoice: result.invoice });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = invoiceUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invÃ¡lidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateInvoice(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo actualizar la factura." },
      { status: 400 }
    );
  }

  return NextResponse.json({ invoice: result.invoice });
}
