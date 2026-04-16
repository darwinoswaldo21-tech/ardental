import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type OrthodonticTreatmentRow = {
  id: string;
  patient_id: string;
  status: string | null;
  appliance_type: string | null;
  start_date: string | null;
  estimated_end_date: string | null;
  patients?: {
    first_name?: string | null;
    last_name?: string | null;
    id_number?: string | null;
    phone?: string | null;
  } | null;
};

const applianceLabels: Record<string, string> = {
  metal_brackets: "Brackets metalicos",
  aesthetic_brackets: "Brackets esteticos",
  aligners: "Alineadores",
  other: "Otro",
};

export default async function OrthodonticsPage() {
  const supabase = await createClient();
  const { data: treatments } = await supabase
    .from("orthodontic_treatments")
    .select(
      "id, patient_id, status, appliance_type, start_date, estimated_end_date, patients(first_name,last_name,id_number,phone)"
    )
    .order("start_date", { ascending: false });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Ortodoncia</h1>
          <p className="text-sm text-slate-600">
            Tratamientos ortodonticos registrados
          </p>
        </div>
        <Link
          href="/patients"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ir a pacientes
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <div className="col-span-4">Paciente</div>
          <div className="col-span-3">Aparato</div>
          <div className="col-span-2">Inicio</div>
          <div className="col-span-2">Fin estimado</div>
          <div className="col-span-1 text-right">Estado</div>
        </div>
        <div className="divide-y divide-slate-200">
          {treatments && treatments.length > 0 ? (
            treatments.map((treatment: OrthodonticTreatmentRow) => {
              const patient = treatment.patients;
              const name = patient
                ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
                : "Paciente";
              return (
                <Link
                  key={treatment.id}
                  href={`/patients/${treatment.patient_id}`}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <div className="col-span-4 font-medium">
                    {name || "Paciente"}
                    <div className="text-xs text-slate-500">
                      {patient?.id_number ?? "—"} · {patient?.phone ?? "—"}
                    </div>
                  </div>
                  <div className="col-span-3">
                    {treatment.appliance_type
                      ? applianceLabels[treatment.appliance_type] ??
                        treatment.appliance_type
                      : "—"}
                  </div>
                  <div className="col-span-2">
                    {treatment.start_date ?? "—"}
                  </div>
                  <div className="col-span-2">
                    {treatment.estimated_end_date ?? "—"}
                  </div>
                  <div className="col-span-1 text-right">
                    {treatment.status ?? "—"}
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500">
              No hay tratamientos registrados.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
