import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClinicalTabs from "@/components/clinical/ClinicalTabs";

type PatientEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientEditPage({
  params,
}: PatientEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, id_number, phone, email, address, status, created_at, allergies, current_medications, systemic_diseases, takes_anticoagulants, blood_type"
    )
    .eq("id", id)
    .maybeSingle();

  if (!patient) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-slate-600">Detalle del paciente</p>
        </div>
        <a
          href={`/finance/statement?patientId=${patient.id}`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver estado de cuenta
        </a>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-400">Cédula</dt>
            <dd className="text-slate-700">{patient.id_number ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Teléfono</dt>
            <dd className="text-slate-700">{patient.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Email</dt>
            <dd className="text-slate-700">{patient.email ?? "—"}</dd>
          </div>
          {patient.address ? (
            <div>
              <dt className="text-xs uppercase text-slate-400">Dirección</dt>
              <dd className="text-slate-700">{patient.address}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs uppercase text-slate-400">Estado</dt>
            <dd className="text-slate-700">{patient.status ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <ClinicalTabs
        patientId={patient.id}
        defaultValues={{
          allergies: patient.allergies ?? [],
          current_medications: patient.current_medications ?? [],
          systemic_diseases: patient.systemic_diseases ?? [],
          takes_anticoagulants: patient.takes_anticoagulants ?? false,
          blood_type: patient.blood_type ?? "",
        }}
      />
    </section>
  );
}
