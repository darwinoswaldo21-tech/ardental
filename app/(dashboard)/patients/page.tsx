import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/types/patient";

export default async function PatientsPage(
  props: { searchParams: Promise<{ q?: string }> }
) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;
  const query = searchParams?.q?.trim() ?? "";

  let request = supabase
    .from("patients")
    .select("id, first_name, last_name, id_number, phone, status, created_at")
    .order("created_at", { ascending: false });

  if (query) {
    request = request.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,id_number.ilike.%${query}%,phone.ilike.%${query}%`
    );
  }

  const { data: patients } = await request;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-600">
            Gestión básica de pacientes
          </p>
        </div>
        <Link
          href="/patients/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo paciente
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre, cédula o teléfono"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-slate-300 px-4 py-2 text-sm">
          Buscar
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <div className="col-span-4">Nombre</div>
          <div className="col-span-3">Cédula</div>
          <div className="col-span-3">Teléfono</div>
          <div className="col-span-2 text-right">Estado</div>
        </div>
        <div className="divide-y divide-slate-200">
          {patients && patients.length > 0 ? (
            patients.map((patient: Patient) => (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                <div className="col-span-4 font-medium">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="col-span-3">{patient.id_number ?? "—"}</div>
                <div className="col-span-3">{patient.phone ?? "—"}</div>
                <div className="col-span-2 text-right">
                  {patient.status ?? "—"}
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500">
              No hay pacientes registrados.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
