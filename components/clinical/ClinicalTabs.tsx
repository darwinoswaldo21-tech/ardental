"use client";

import { useState } from "react";
import ClinicalHistorySection from "@/components/clinical/ClinicalHistorySection";
import ClinicalNotesSection from "@/components/clinical/ClinicalNotesSection";
import OdontogramSection from "@/components/clinical/OdontogramSection";
import OrthodonticsSection from "@/components/orthodontics/OrthodonticsSection";
import PatientRecordSection from "@/components/records/PatientRecordSection";

type ClinicalTabsProps = {
  patientId: string;
  defaultValues: {
    allergies?: string[] | null;
    current_medications?: string[] | null;
    systemic_diseases?: string[] | null;
    takes_anticoagulants?: boolean | null;
    blood_type?: string | null;
  };
};

export default function ClinicalTabs({
  patientId,
  defaultValues,
}: ClinicalTabsProps) {
  const [tab, setTab] = useState<
    "history" | "notes" | "odontogram" | "orthodontics" | "record"
  >("history");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "history", label: "Historia clínica" },
          { key: "notes", label: "Notas clínicas" },
          { key: "odontogram", label: "Odontograma" },
          { key: "orthodontics", label: "Ortodoncia" },
          { key: "record", label: "Expediente" },
        ].map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as typeof tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {tab === "history" ? (
          <ClinicalHistorySection
            patientId={patientId}
            defaultValues={defaultValues}
          />
        ) : null}
        {tab === "notes" ? <ClinicalNotesSection patientId={patientId} /> : null}
        {tab === "odontogram" ? (
          <OdontogramSection patientId={patientId} />
        ) : null}
        {tab === "orthodontics" ? (
          <OrthodonticsSection patientId={patientId} />
        ) : null}
        {tab === "record" ? (
          <PatientRecordSection patientId={patientId} />
        ) : null}
      </div>
    </div>
  );
}
