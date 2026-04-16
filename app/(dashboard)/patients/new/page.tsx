import PatientForm from "@/components/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Nuevo paciente
        </h1>
        <p className="text-sm text-slate-600">Registro básico</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <PatientForm mode="create" />
      </div>
    </section>
  );
}
