"use client";

import { useEffect, useMemo, useState } from "react";

type ToothRecord = {
  tooth_number: number;
  condition: string;
  affected_faces?: string[] | null;
  notes?: string | null;
};

type OdontogramSectionProps = {
  patientId: string;
};

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const conditions = [
  "healthy",
  "caries",
  "filling",
  "crown",
  "bridge",
  "implant",
  "extracted",
  "absent",
  "fracture",
  "root_canal",
  "other",
];

const conditionLabels: Record<string, string> = {
  healthy: "Sano",
  caries: "Caries",
  filling: "Obturación",
  crown: "Corona",
  bridge: "Puente",
  implant: "Implante",
  extracted: "Extraído",
  absent: "Ausente",
  fracture: "Fractura",
  root_canal: "Endodoncia",
  other: "Otro",
};

const conditionColors: Record<string, string> = {
  healthy: "fill-emerald-50 stroke-emerald-400",
  caries: "fill-amber-100 stroke-amber-500",
  filling: "fill-sky-100 stroke-sky-500",
  crown: "fill-blue-100 stroke-blue-500",
  bridge: "fill-indigo-100 stroke-indigo-500",
  implant: "fill-slate-100 stroke-slate-500",
  extracted: "fill-rose-100 stroke-rose-500",
  absent: "fill-slate-50 stroke-slate-300",
  fracture: "fill-orange-100 stroke-orange-500",
  root_canal: "fill-teal-100 stroke-teal-500",
  other: "fill-gray-100 stroke-gray-400",
};

const faces = ["mesial", "distal", "vestibular", "lingual", "occlusal"];

export default function OdontogramSection({ patientId }: OdontogramSectionProps) {
  const [records, setRecords] = useState<Record<number, ToothRecord>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const initialRecords = useMemo(() => {
    const map: Record<number, ToothRecord> = {};
    [...upperTeeth, ...lowerTeeth].forEach((tooth) => {
      map[tooth] = { tooth_number: tooth, condition: "healthy", affected_faces: [] };
    });
    return map;
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch(`/api/tooth-records?patient_id=${patientId}`);
      if (!response.ok) {
        setError("No se pudo cargar el odontograma.");
        setLoading(false);
        return;
      }
      const json = await response.json();
      const map = { ...initialRecords };
      (json.data ?? []).forEach((item: ToothRecord) => {
        map[item.tooth_number] = {
          tooth_number: item.tooth_number,
          condition: item.condition,
          affected_faces: item.affected_faces ?? [],
          notes: item.notes ?? "",
        };
      });
      setRecords(map);
      setLoading(false);
    };
    load();
  }, [patientId, initialRecords]);

  const updateRecord = (tooth: number, update: Partial<ToothRecord>) => {
    setRecords((prev) => ({
      ...prev,
      [tooth]: { ...prev[tooth], ...update },
    }));
  };

  const toggleFace = (tooth: number, face: string) => {
    const current = records[tooth]?.affected_faces ?? [];
    if (current.includes(face)) {
      updateRecord(tooth, {
        affected_faces: current.filter((item) => item !== face),
      });
    } else {
      updateRecord(tooth, { affected_faces: [...current, face] });
    }
  };

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    const payload = {
      patient_id: patientId,
      records: Object.values(records),
    };
    console.log("[Odontograma] payload:", payload);
    const response = await fetch("/api/tooth-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    console.log("[Odontograma] response status:", response.status);
    if (!response.ok) {
      const json = await response.json().catch(() => null);
      console.log("[Odontograma] response body:", json);
      setError(json?.error ?? "No se pudo guardar el odontograma.");
      return;
    }
    const json = await response.json().catch(() => null);
    console.log("[Odontograma] response body:", json);
    setSuccess("Odontograma guardado.");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Odontograma</h3>
        <button
          type="button"
          onClick={onSave}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Guardar odontograma
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando odontograma...</p>
      ) : (
        <div className="rounded-[32px] border border-rose-100 bg-gradient-to-b from-rose-50 via-white to-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vista de boca
          </div>

          <div className="mt-4 space-y-8">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">
                Arcada superior
              </div>
              <div className="relative mt-3 rounded-[30px] border border-rose-100 bg-gradient-to-b from-rose-100 via-rose-50 to-white px-4 py-6">
                <div className="pointer-events-none absolute inset-x-6 top-4 h-8 rounded-full bg-rose-100/60 blur-[10px]" />
                <div className="absolute left-6 right-6 top-1/2 h-px bg-rose-200/70" />
                <div className="relative flex flex-wrap justify-center gap-2">
                  {upperTeeth.map((tooth, index) => (
                    <ToothMouth
                      key={tooth}
                      record={records[tooth]}
                      selected={selectedTooth === tooth}
                      offset={getOffset(index, true)}
                      onSelect={() => setSelectedTooth(tooth)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">
                Arcada inferior
              </div>
              <div className="relative mt-3 rounded-[30px] border border-rose-100 bg-gradient-to-t from-rose-100 via-rose-50 to-white px-4 py-6">
                <div className="pointer-events-none absolute inset-x-6 bottom-4 h-8 rounded-full bg-rose-100/60 blur-[10px]" />
                <div className="absolute left-6 right-6 top-1/2 h-px bg-rose-200/70" />
                <div className="relative flex flex-wrap justify-center gap-2">
                  {lowerTeeth.map((tooth, index) => (
                    <ToothMouth
                      key={tooth}
                      record={records[tooth]}
                      selected={selectedTooth === tooth}
                      offset={getOffset(index, false)}
                      onSelect={() => setSelectedTooth(tooth)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Edición en línea
            </div>
            {selectedTooth ? (
              <div className="mt-3 grid gap-4 lg:grid-cols-[1.1fr,1fr]">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-500">Pieza</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedTooth}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {conditionLabels[records[selectedTooth]?.condition ?? "healthy"]}
                    </span>
                  </div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Condición
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={records[selectedTooth]?.condition}
                    onChange={(event) =>
                      updateRecord(selectedTooth, { condition: event.target.value })
                    }
                  >
                    {conditions.map((option) => (
                      <option key={option} value={option}>
                        {conditionLabels[option]}
                      </option>
                    ))}
                  </select>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Notas rápidas
                  </label>
                  <textarea
                    className="min-h-[88px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={records[selectedTooth]?.notes ?? ""}
                    onChange={(event) =>
                      updateRecord(selectedTooth, { notes: event.target.value })
                    }
                    placeholder="Observaciones clínicas..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Caras afectadas
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {faces.map((face) => (
                      <button
                        key={face}
                        type="button"
                        onClick={() => toggleFace(selectedTooth, face)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          (records[selectedTooth]?.affected_faces ?? []).includes(face)
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {face}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Selecciona un diente para editarlo directamente aquí.
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </section>
  );
}

function ToothMouth({
  record,
  selected,
  offset,
  onSelect,
}: {
  record: ToothRecord;
  selected: boolean;
  offset: number;
  onSelect: () => void;
}) {
  const colorClass =
    conditionColors[record.condition] ?? "fill-slate-100 stroke-slate-400";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative rounded-[18px] border bg-white/90 px-3 py-2 text-[10px] shadow-sm transition ${
        selected
          ? "border-blue-500 ring-2 ring-blue-200 shadow-md"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
      style={{ transform: `translateY(${offset}px)` }}
      aria-pressed={selected}
      title={`Pieza ${record.tooth_number}`}
    >
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span className="font-semibold">{record.tooth_number}</span>
        <span className="hidden text-[9px] uppercase tracking-wide text-slate-400 lg:inline">
          {conditionLabels[record.condition] ?? record.condition}
        </span>
      </div>
      <div className="relative mx-auto mt-2 h-12 w-12">
        <svg
          viewBox="0 0 64 80"
          className={`absolute inset-0 h-12 w-12 ${colorClass}`}
          fill="none"
          strokeWidth="2"
        >
          <path d="M18 6c5-4 23-4 28 0 7 6 7 22 3 36-2 6-3 18-4 26-1 7-6 12-13 12s-12-5-13-12c-1-8-2-20-4-26-4-14-4-30 3-36z" />
          <path d="M22 28c3 5 17 5 20 0" />
          <path d="M24 46c2 10 14 10 16 0" className="opacity-40" />
        </svg>
        <span className="pointer-events-none absolute inset-x-2 top-1 h-2 rounded-full bg-white/60 blur-[2px]" />
      </div>
      <span className="pointer-events-none absolute inset-x-2 -bottom-2 h-1 rounded-full bg-rose-100 opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

function getOffset(index: number, isUpper: boolean) {
  const curve = [8, 4, 2, 0, 0, 2, 4, 8, 8, 4, 2, 0, 0, 2, 4, 8];
  const base = curve[index] ?? 0;
  return isUpper ? -base : base;
}
