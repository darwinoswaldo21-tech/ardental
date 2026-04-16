import AppointmentForm from "@/components/appointments/AppointmentForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewAppointmentPage() {
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .order("first_name");

  const patientOptions =
    patients?.map((patient) => ({
      id: patient.id,
      label: `${patient.first_name} ${patient.last_name}`,
    })) ?? [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nueva cita</h1>
        <p className="text-sm text-slate-600">Agenda básica</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <AppointmentForm patients={patientOptions} />
      </div>
    </section>
  );
}
