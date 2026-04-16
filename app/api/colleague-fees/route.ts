import { NextResponse } from "next/server";
import { colleagueFeeSchema } from "@/lib/validations/colleagues";
import {
  createColleagueFee,
  listColleagueFees,
} from "@/lib/colleagues/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const colleagueId = url.searchParams.get("colleague_id");

  if (!colleagueId) {
    return NextResponse.json(
      { error: "Colleague requerido." },
      { status: 400 }
    );
  }

  try {
    const data = await listColleagueFees(colleagueId);
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
  const parsed = colleagueFeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createColleagueFee(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo registrar el pago." },
      { status: 400 }
    );
  }

  return NextResponse.json({ fee: result.fee });
}
