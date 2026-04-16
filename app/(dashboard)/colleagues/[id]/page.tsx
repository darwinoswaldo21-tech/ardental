import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ColleagueFeesClient from "@/components/colleagues/ColleagueFeesClient";

type ColleagueDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ColleagueDetailPage({
  params,
}: ColleagueDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: colleague } = await supabase
    .from("colleagues")
    .select(
      "id, full_name, specialty_id, phone, email, notes, is_active, created_at, specialties(id, name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!colleague) {
    notFound();
  }

  const { data: fees } = await supabase
    .from("colleague_fees")
    .select(
      "id, colleague_id, amount, payment_date, payment_method, notes, created_at"
    )
    .eq("colleague_id", id)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {colleague.full_name}
          </h1>
          <p className="text-sm text-slate-600">
            {colleague.specialties?.name ?? "Especialidad"}
          </p>
        </div>
        <Link
          href="/colleagues"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver a colegas
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-400">Telefono</dt>
            <dd className="text-slate-700">{colleague.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Email</dt>
            <dd className="text-slate-700">{colleague.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Estado</dt>
            <dd className="text-slate-700">
              {colleague.is_active === false ? "Inactivo" : "Activo"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Notas</dt>
            <dd className="text-slate-700">
              {colleague.notes ?? "Sin notas"}
            </dd>
          </div>
        </dl>
      </div>

      <ColleagueFeesClient colleague={colleague} fees={fees ?? []} />
    </section>
  );
}
