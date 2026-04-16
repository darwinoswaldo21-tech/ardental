import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const [paymentsResult, colleagueFeesResult] = await Promise.all([
      supabase.from("payments").select("amount"),
      supabase.from("colleague_fees").select("amount"),
    ]);

    if (paymentsResult.error) {
      throw new Error(paymentsResult.error.message);
    }

    if (colleagueFeesResult.error) {
      throw new Error(colleagueFeesResult.error.message);
    }

    const totalIncome = (paymentsResult.data ?? []).reduce(
      (total, payment) => total + Number(payment.amount ?? 0),
      0
    );

    const totalExpenses = (colleagueFeesResult.data ?? []).reduce(
      (total, fee) => total + Number(fee.amount ?? 0),
      0
    );

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el reporte." },
      { status: 500 }
    );
  }
}
