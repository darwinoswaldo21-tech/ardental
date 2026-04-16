import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/patients", label: "Pacientes" },
  { href: "/appointments", label: "Citas" },
  { href: "/orthodontics", label: "Ortodoncia" },
  { href: "/finance", label: "Finanzas" },
  { href: "/colleagues", label: "Colegas" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-200 md:bg-white">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <img
          src="/logo.png"
          alt="ArDental"
          className="h-14 w-14 object-contain rounded-md bg-slate-100 p-1"
        />
        <span className="ml-3 font-semibold text-slate-900">ArDental</span>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
