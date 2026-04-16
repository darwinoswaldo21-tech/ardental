import { NextResponse } from "next/server";
import {
  colleagueSchema,
  colleagueUpdateSchema,
} from "@/lib/validations/colleagues";
import {
  createColleague,
  listColleagues,
  updateColleague,
} from "@/lib/colleagues/service";

export async function GET() {
  try {
    const data = await listColleagues();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los colegas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = colleagueSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createColleague(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo crear el colega." },
      { status: 400 }
    );
  }

  return NextResponse.json({ colleague: result.colleague });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = colleagueUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateColleague(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo actualizar el colega." },
      { status: 400 }
    );
  }

  return NextResponse.json({ colleague: result.colleague });
}
