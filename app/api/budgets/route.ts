import { NextResponse } from "next/server";
import {
  budgetSchema,
  budgetUpdateSchema,
} from "@/lib/validations/finance";
import {
  createBudget,
  listBudgets,
  updateBudget,
} from "@/lib/finance/service";

export async function GET() {
  try {
    const data = await listBudgets();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los presupuestos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = budgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invÃ¡lidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createBudget(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo crear el presupuesto." },
      { status: 400 }
    );
  }

  return NextResponse.json({ budget: result.budget });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = budgetUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invÃ¡lidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateBudget(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "No se pudo actualizar el presupuesto." },
      { status: 400 }
    );
  }

  return NextResponse.json({ budget: result.budget });
}
