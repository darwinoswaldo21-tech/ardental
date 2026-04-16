"use client";

import { useEffect, useMemo, useState } from "react";

type BracketRecord = {
  tooth_number: number;
  bracket_brand?: string | null;
  placement_date?: string | null;
  notes?: string | null;
  placed?: boolean;
};

type OrthodonticBracketsSectionProps = {
  patientId: string;
};

const upperTeeth = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];
const lowerTeeth = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export default function OrthodonticBracketsSection({
  patientId,
}: OrthodonticBracketsSectionProps) {
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<number, BracketRecord>>({});
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Set<number>>(new Set());
  const [bulkBrand, setBulkBrand] = useState("");
  const [bulkDate, setBulkDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const initialRecords = useMemo(() => {
    const map: Record<number, BracketRecord> = {};
    [...upperTeeth, ...lowerTeeth].forEach((tooth) => {
      map[tooth] = {
        tooth_number: tooth,
        bracket_brand: "",
        placement_date: "",
        notes: "",
        placed: false,
      };
    });
    return map;
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const treatmentResponse = await fetch(
        `/api/orthodontic-treatments?patientId=${patientId}`
      );
      if (!treatmentResponse.ok) {
        const data = await treatmentResponse.json().catch(() => ({}));
        if (!active) return;
        setError(data.error ?? "No se pudo cargar el tratamiento.");
        setLoading(false);
        return;
      }
      const treatmentJson = await treatmentResponse.json();
      const treatment = treatmentJson?.treatment;
      if (!active) return;
      if (!treatment?.id) {
        setTreatmentId(null);
        setRecords(initialRecords);
        setLoading(false);
        return;
      }

      setTreatmentId(treatment.id);
      const response = await fetch(
        `/api/bracket-records?treatmentId=${treatment.id}`
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setError(data.error ?? "No se pudieron cargar los brackets.");
        setLoading(false);
        return;
      }
      const json = await response.json();
      const map = { ...initialRecords };
      (json.records ?? []).forEach((item: BracketRecord) => {
        map[item.tooth_number] = {
          tooth_number: item.tooth_number,
          bracket_brand: item.bracket_brand ?? "",
          placement_date: item.placement_date ?? "",
          notes: item.notes ?? "",
          placed: true,
        };
      });
      setRecords(map);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [patientId, initialRecords]);

  const updateRecord = (tooth: number, update: Partial<BracketRecord>) => {
    setRecords((prev) => ({
      ...prev,
      [tooth]: { ...prev[tooth], ...update },
    }));
  };

  const toggleTooth = (tooth: number) => {
    const current = records[tooth];
    if (current?.placed) {
      const confirmed = window.confirm(
        `Quitar bracket del diente ${tooth}?`
      );
      if (!confirmed) {
        setSelectedTooth(tooth);
        return;
      }
      updateRecord(tooth, {
        placed: false,
        bracket_brand: "",
        placement_date: "",
        notes: "",
      });
    } else {
      updateRecord(tooth, { placed: true });
    }
    setSelectedTooth(tooth);
  };

  const toggleBulkTooth = (tooth: number) => {
    setBulkSelection((prev) => {
      const next = new Set(prev);
      if (next.has(tooth)) {
        next.delete(tooth);
      } else {
        next.add(tooth);
      }
      return next;
    });
  };

  const setMany = (teeth: number[]) => {
    setBulkSelection(new Set(teeth));
  };

  const applyBulkTo = (teeth: number[]) => {
    if (!bulkDate) {
      setError("Ingresa la fecha de colocacion antes de aplicar.");
      return;
    }
    setBulkSelection(new Set(teeth));
    setRecords((prev) => {
      const next = { ...prev };
      teeth.forEach((tooth) => {
        next[tooth] = {
          ...next[tooth],
          placed: true,
          bracket_brand: bulkBrand || next[tooth].bracket_brand,
          placement_date: bulkDate || next[tooth].placement_date,
        };
      });
      return next;
    });
  };

  const applyBulk = () => {
    if (bulkSelection.size === 0) return;
    setRecords((prev) => {
      const next = { ...prev };
      bulkSelection.forEach((tooth) => {
        next[tooth] = {
          ...next[tooth],
          placed: true,
          bracket_brand: bulkBrand || next[tooth].bracket_brand,
          placement_date: bulkDate || next[tooth].placement_date,
        };
      });
      return next;
    });
  };

  const clearBulkSelection = () => {
    setBulkSelection(new Set());
  };

  const onSave = async () => {
    if (!treatmentId) {
      setError("Primero crea un tratamiento para registrar brackets.");
      return;
    }
    const placedRecords = Object.values(records).filter((item) => item.placed);
    if (placedRecords.length === 0) {
      setError("Selecciona al menos un diente para guardar.");
      return;
    }
    const missingDate = placedRecords.find(
      (item) => !item.placement_date || item.placement_date.trim() === ""
    );
    if (missingDate) {
      setError("Cada bracket debe tener fecha de colocacion.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload = {
      treatment_id: treatmentId,
      records: placedRecords.map((item) => ({
          tooth_number: item.tooth_number,
          bracket_brand: item.bracket_brand || null,
          placement_date: item.placement_date || null,
          notes: item.notes || null,
        })),
    };

    const response = await fetch("/api/bracket-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "No se pudieron guardar los brackets.");
      setSaving(false);
      return;
    }
    setSuccess("Brackets guardados correctamente.");
    setSaving(false);
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando brackets...</p>;
  }

  if (!treatmentId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Crea un tratamiento para registrar brackets por diente.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Brackets por diente
          </h3>
          <p className="text-xs text-slate-500">
            Haz clic en un diente para marcar bracket y editar detalles.
          </p>
          <p className="text-xs text-slate-500">
            Los campos con * son obligatorios.
          </p>
          <p className="text-xs text-slate-500">
            Verde = bracket colocado. Gris = pendiente.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar brackets"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Seleccion rapida
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyBulkTo([...upperTeeth, ...lowerTeeth])}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => applyBulkTo(upperTeeth)}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              Arcada superior
            </button>
            <button
              type="button"
              onClick={() => applyBulkTo(lowerTeeth)}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              Arcada inferior
            </button>
            <button
              type="button"
              onClick={clearBulkSelection}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              Limpiar seleccion
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,auto]">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Marca (aplica a seleccion)
              </label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={bulkBrand}
                onChange={(event) => setBulkBrand(event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Fecha de colocacion *
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={bulkDate}
                onChange={(event) => setBulkDate(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={applyBulk}
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Aplicar a seleccion
              </button>
            </div>
          </div>
        </div>

        <TeethRow
          title="Arcada superior"
          teeth={upperTeeth}
          records={records}
          selectedTooth={selectedTooth}
          onSelect={toggleTooth}
          bulkSelection={bulkSelection}
          onBulkToggle={toggleBulkTooth}
        />
        <TeethRow
          title="Arcada inferior"
          teeth={lowerTeeth}
          records={records}
          selectedTooth={selectedTooth}
          onSelect={toggleTooth}
          bulkSelection={bulkSelection}
          onBulkToggle={toggleBulkTooth}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase text-slate-500">
          Detalle del diente
        </div>
        {selectedTooth ? (
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Pieza
              </label>
              <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                {selectedTooth}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Marca de bracket
              </label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={records[selectedTooth]?.bracket_brand ?? ""}
                onChange={(event) =>
                  updateRecord(selectedTooth, {
                    bracket_brand: event.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Fecha de colocacion *
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={records[selectedTooth]?.placement_date ?? ""}
                onChange={(event) =>
                  updateRecord(selectedTooth, {
                    placement_date: event.target.value,
                  })
                }
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Notas
              </label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={2}
                value={records[selectedTooth]?.notes ?? ""}
                onChange={(event) =>
                  updateRecord(selectedTooth, { notes: event.target.value })
                }
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Selecciona un diente para editarlo.
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
    </section>
  );
}

function TeethRow({
  title,
  teeth,
  records,
  selectedTooth,
  onSelect,
  bulkSelection,
  onBulkToggle,
}: {
  title: string;
  teeth: number[];
  records: Record<number, BracketRecord>;
  selectedTooth: number | null;
  onSelect: (tooth: number) => void;
  bulkSelection: Set<number>;
  onBulkToggle: (tooth: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-slate-500">{title}</div>
      <div className="flex flex-wrap gap-2">
        {teeth.map((tooth) => {
          const record = records[tooth];
          const placed = record?.placed;
          const selected = selectedTooth === tooth;
          const bulkSelected = bulkSelection.has(tooth);
          return (
            <button
              key={tooth}
              type="button"
              onClick={() => onSelect(tooth)}
              onDoubleClick={() => onBulkToggle(tooth)}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                placed
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              } ${selected ? "ring-2 ring-blue-200" : ""} ${
                bulkSelected ? "outline outline-2 outline-amber-300" : ""
              }`}
              title="Doble clic para seleccion rapida"
            >
              {tooth}
            </button>
          );
        })}
      </div>
    </div>
  );
}
