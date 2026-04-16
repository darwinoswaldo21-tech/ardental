"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Specialty = {
  id: string;
  name?: string | null;
};

type Colleague = {
  id: string;
  full_name: string;
  specialty_id?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  specialties?: Specialty[];
};

type ColleaguesClientProps = {
  colleagues: Colleague[];
  specialties: Specialty[];
};

const statusLabel = (isActive?: boolean | null) =>
  isActive === false ? "Inactivo" : "Activo";

export default function ColleaguesClient({
  colleagues,
  specialties,
}: ColleaguesClientProps) {
  const router = useRouter();
  const [list, setList] = useState<Colleague[]>(colleagues);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Colleague | null>(null);
  const [fullName, setFullName] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const specialtyMap = useMemo(() => {
    const map = new Map<string, Specialty>();
    specialties.forEach((item) => map.set(item.id, item));
    return map;
  }, [specialties]);

  const resetForm = () => {
    setFullName("");
    setSpecialtyId("");
    setPhone("");
    setEmail("");
    setNotes("");
    setIsActive(true);
    setError(null);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setIsOpen(true);
  };

  const openEdit = (colleague: Colleague) => {
    setEditing(colleague);
    setFullName(colleague.full_name ?? "");
    setSpecialtyId(colleague.specialty_id ?? "");
    setPhone(colleague.phone ?? "");
    setEmail(colleague.email ?? "");
    setNotes(colleague.notes ?? "");
    setIsActive(colleague.is_active ?? true);
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!fullName.trim()) {
      setError("Nombre requerido.");
      return;
    }
    if (!specialtyId) {
      setError("Selecciona una especialidad.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/colleagues", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          full_name: fullName.trim(),
          specialty_id: specialtyId,
          phone: phone || null,
          email: email || null,
          notes: notes || null,
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo guardar el colega.");
      }

      const data = await response.json();
      const colleague: Colleague = data.colleague;

      setList((prev) => {
        if (editing) {
          return prev.map((item) => (item.id === colleague.id ? colleague : item));
        }
        return [colleague, ...prev];
      });

      setMessage(
        editing ? "Colega actualizado correctamente." : "Colega creado correctamente."
      );
      setIsOpen(false);
      setEditing(null);
      resetForm();
    } catch (err: any) {
      setError(err.message ?? "No se pudo guardar el colega.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (event: React.MouseEvent, colleague: Colleague) => {
    event.stopPropagation();
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/colleagues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: colleague.id,
          full_name: colleague.full_name,
          specialty_id: colleague.specialty_id,
          phone: colleague.phone ?? null,
          email: colleague.email ?? null,
          notes: colleague.notes ?? null,
          is_active: !colleague.is_active,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo actualizar el estado.");
      }

      const data = await response.json();
      const updated: Colleague = data.colleague;
      setList((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setMessage("Estado actualizado.");
    } catch (err: any) {
      setError(err.message ?? "No se pudo actualizar el estado.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Colegas</h1>
          <p className="text-sm text-slate-600">
            Administra colegas y especialidades asociadas.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo colega
        </button>
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <div className="col-span-4">Nombre</div>
          <div className="col-span-3">Especialidad</div>
          <div className="col-span-3">Contacto</div>
          <div className="col-span-2 text-right">Estado</div>
        </div>
        <div className="divide-y divide-slate-200">
          {list.length > 0 ? (
            list.map((colleague) => (
              <div
                key={colleague.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/colleagues/${colleague.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    router.push(`/colleagues/${colleague.id}`);
                  }
                }}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                <div className="col-span-4">
                  <div className="font-medium">{colleague.full_name}</div>
                  <div className="text-xs text-slate-500">
                    {colleague.email ?? "-"}
                  </div>
                </div>
                <div className="col-span-3">
                  {colleague.specialties?.name ??
                    specialtyMap.get(colleague.specialty_id ?? "")?.name ??
                    "-"}
                </div>
                <div className="col-span-3">
                  <div>{colleague.phone ?? "-"}</div>
                  <div className="text-xs text-slate-500">
                    {colleague.notes ? "Con notas" : "Sin notas"}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      colleague.is_active === false
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {statusLabel(colleague.is_active)}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(colleague);
                    }}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(event) => toggleActive(event, colleague)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {colleague.is_active === false ? "Activar" : "Desactivar"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500">
              No hay colegas registrados.
            </div>
          )}
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg border border-slate-200 animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editing ? "Editar colega" : "Nuevo colega"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-3 text-sm text-slate-700">
              <div>
                <label className="text-xs uppercase text-slate-400 block">
                  Nombre completo
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-400 block">
                  Especialidad
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={specialtyId}
                  onChange={(event) => setSpecialtyId(event.target.value)}
                >
                  <option value="">Selecciona una especialidad</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name ?? "Especialidad"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase text-slate-400 block">
                    Telefono
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-slate-400 block">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-400 block">
                  Notas
                </label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                Colega activo
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
