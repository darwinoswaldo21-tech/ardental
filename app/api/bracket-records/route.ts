import { NextResponse } from "next/server";
import {
  bracketRecordsPayloadSchema,
} from "@/lib/validations/orthodontics";
import {
  getBracketRecordsByTreatmentId,
  replaceBracketRecords,
} from "@/lib/orthodontics/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const treatmentId = searchParams.get("treatmentId");

  if (!treatmentId) {
    return NextResponse.json(
      { error: "Tratamiento requerido" },
      { status: 400 }
    );
  }

  const result = await getBracketRecordsByTreatmentId(treatmentId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudieron cargar los brackets" },
      { status: 400 }
    );
  }

  return NextResponse.json({ records: result.records });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bracketRecordsPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await replaceBracketRecords(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudieron guardar los brackets" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
