import { createClient } from "@/lib/supabase/server";

type StatementPageProps = {
  searchParams: Promise<{ patientId?: string }>;
};

const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

export default async function StatementPage({ searchParams }: StatementPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const patientId = params?.patientId ?? "";

  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, id_number, phone")
    .order("created_at", { ascending: false });

  const { data: patient } = patientId
    ? await supabase
        .from("patients")
        .select("id, first_name, last_name, id_number, phone")
        .eq("id", patientId)
        .maybeSingle()
    : { data: null };

  const { data: invoices } = patientId
    ? await supabase
        .from("invoices")
        .select("id, invoice_number, total, status, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: payments } = patientId
    ? await supabase
        .from("payments")
        .select(
          "id, amount, payment_method, concept, payment_date, reference, notes, invoice_id, created_at"
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
    : { data: [] };

  const validInvoices = (invoices ?? []).filter(
    (invoice) => invoice.status !== "cancelled"
  );
  const totalInvoiced = validInvoices.reduce(
    (acc, invoice) => acc + Number(invoice.total ?? 0),
    0
  );
  const totalPaid = (payments ?? []).reduce(
    (acc, payment) => acc + Number(payment.amount ?? 0),
    0
  );
  const balance = totalInvoiced - totalPaid;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Estado de cuenta
        </h1>
        <p className="text-sm text-slate-600">
          Consulta rÃ¡pida de saldos por paciente.
        </p>
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          Paciente
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            name="patientId"
            defaultValue={patientId}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm md:w-96"
          >
            <option value="">Selecciona un paciente</option>
            {(patients ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.first_name} {item.last_name}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Ver estado
          </button>
        </div>
      </form>

      {patient ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="text-sm text-slate-500">
              {patient.id_number ?? "â€”"} Â· {patient.phone ?? "â€”"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">
                Total facturado
              </p>
              <p className="text-xl font-semibold text-slate-900">
                {currency.format(totalInvoiced)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Total pagado</p>
              <p className="text-xl font-semibold text-slate-900">
                {currency.format(totalPaid)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Saldo</p>
              <p className="text-xl font-semibold text-slate-900">
                {currency.format(balance)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {patient ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Facturas</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {validInvoices.length > 0 ? (
                validInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between px-4 py-3 text-sm text-slate-700"
                  >
                    <div>
                      <p className="font-medium">
                        {invoice.invoice_number ?? invoice.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {invoice.created_at
                          ? new Date(invoice.created_at).toLocaleDateString()
                          : "â€”"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{currency.format(invoice.total ?? 0)}</p>
                      <p className="text-xs text-slate-500">
                        {invoice.status ?? "â€”"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No hay facturas registradas.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Pagos</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {(payments ?? []).length > 0 ? (
                (payments ?? []).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between px-4 py-3 text-sm text-slate-700"
                  >
                    <div>
                      <p className="font-medium">{payment.concept}</p>
                      <p className="text-xs text-slate-500">
                        {payment.payment_date ??
                          (payment.created_at
                            ? new Date(payment.created_at).toLocaleDateString()
                            : "â€”")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{currency.format(payment.amount ?? 0)}</p>
                      <p className="text-xs text-slate-500">
                        {payment.payment_method}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No hay pagos registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
          Selecciona un paciente para ver su estado de cuenta.
        </div>
      )}
    </section>
  );
}
