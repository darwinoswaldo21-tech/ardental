import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      patientsResult,
      appointmentsResult,
      paymentsResult,
      colleagueFeesResult,
      invoicesResult,
    ] = await Promise.all([
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString()),
      supabase
        .from("payments")
        .select("amount")
        .gte("created_at", startOfMonth.toISOString())
        .lt("created_at", startOfNextMonth.toISOString()),
      supabase
        .from("colleague_fees")
        .select("amount"),
      supabase
        .from("invoices")
        .select(
          "id, patient_id, appointment_id, budget_id, invoice_number, items, subtotal, discount, total, status, created_at, patients(first_name,last_name,id_number,phone)"
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (patientsResult.error) {
      throw new Error(patientsResult.error.message);
    }

    if (appointmentsResult.error) {
      throw new Error(appointmentsResult.error.message);
    }

    if (paymentsResult.error) {
      throw new Error(paymentsResult.error.message);
    }

    if (colleagueFeesResult.error) {
      throw new Error(colleagueFeesResult.error.message);
    }

    if (invoicesResult.error) {
      throw new Error(invoicesResult.error.message);
    }

    const monthlyIncome = (paymentsResult.data ?? []).reduce(
      (total, payment) => total + Number(payment.amount ?? 0),
      0
    );

    const totalColleaguePayments = (colleagueFeesResult.data ?? []).reduce(
      (total, fee) => total + Number(fee.amount ?? 0),
      0
    );

    return NextResponse.json({
      totalPatients: patientsResult.count ?? 0,
      todayAppointments: appointmentsResult.count ?? 0,
      monthlyIncome,
      totalColleaguePayments,
      recentInvoices: invoicesResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el dashboard." },
      { status: 500 }
    );
  }
}
