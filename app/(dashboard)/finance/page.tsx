import Link from "next/link";

const cards = [
  {
    title: "Presupuestos",
    description: "Crea y gestiona presupuestos por paciente.",
    href: "/finance/budgets",
  },
  {
    title: "Facturas",
    description: "Emite facturas y controla estados.",
    href: "/finance/invoices",
  },
  {
    title: "Pagos",
    description: "Registra pagos y abonos parciales.",
    href: "/finance/payments",
  },
  {
    title: "Estado de cuenta",
    description: "Consulta saldos por paciente.",
    href: "/finance/statement",
  },
];

export default function FinancePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Finanzas</h1>
        <p className="text-sm text-slate-600">
          MÃ³dulo financiero rÃ¡pido y sencillo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow"
          >
            <h2 className="text-base font-semibold text-slate-900">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
