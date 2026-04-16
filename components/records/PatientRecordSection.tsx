"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { prescriptionSchema } from "@/lib/validations/prescriptions";

type PatientImage = {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  category:
    | "extraoral_front"
    | "extraoral_profile"
    | "extraoral_smile"
    | "intraoral_upper"
    | "intraoral_lower"
    | "intraoral_lateral"
    | "xray_panoramic"
    | "xray_cephalometric"
    | "xray_periapical"
    | "evolution"
    | "other";
  taken_at: string | null;
  notes: string | null;
  created_at: string;
};

type Prescription = {
  id: string;
  items: Array<{
    name?: string;
    dosage?: string | null;
    instructions?: string | null;
    duration?: string | null;
  }>;
  general_notes: string | null;
  sent_via_whatsapp: boolean | null;
  printed: boolean | null;
  created_at: string;
};

type PatientRecordSectionProps = {
  patientId: string;
};

type FormValues = z.infer<typeof prescriptionSchema>;

const MAX_FILE_SIZE_MB = 10;

const CATEGORY_LABELS: Record<PatientImage["category"], string> = {
  extraoral_front: "Extraoral frente",
  extraoral_profile: "Extraoral perfil",
  extraoral_smile: "Extraoral sonrisa",
  intraoral_upper: "Intraoral superior",
  intraoral_lower: "Intraoral inferior",
  intraoral_lateral: "Intraoral lateral",
  xray_panoramic: "Rx panorámica",
  xray_cephalometric: "Rx cefalométrica",
  xray_periapical: "Rx periapical",
  evolution: "Evolución",
  other: "Documento",
};

const badgeClasses =
  "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600";

export default function PatientRecordSection({
  patientId,
}: PatientRecordSectionProps) {
  const [images, setImages] = useState<PatientImage[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    label: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadCategory, setUploadCategory] = useState<
    "image" | "xray" | "document"
  >("image");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadTakenAt, setUploadTakenAt] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patient_id: patientId,
      appointment_id: "",
      general_notes: "",
      items: [
        {
          name: "",
          dosage: "",
          instructions: "",
          duration: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const loadImages = async () => {
    setLoadingImages(true);
    const response = await fetch(`/api/patient-images?patient_id=${patientId}`);
    if (!response.ok) {
      setError("No se pudieron cargar los archivos.");
      setLoadingImages(false);
      return;
    }
    const json = await response.json();
    setImages(json.data ?? []);
    setLoadingImages(false);
  };

  const loadPrescriptions = async () => {
    setLoadingPrescriptions(true);
    const response = await fetch(
      `/api/prescriptions?patient_id=${patientId}`
    );
    if (!response.ok) {
      setError("No se pudieron cargar las recetas.");
      setLoadingPrescriptions(false);
      return;
    }
    const json = await response.json();
    setPrescriptions(json.data ?? []);
    setLoadingPrescriptions(false);
  };

  useEffect(() => {
    setError(null);
    loadImages();
    loadPrescriptions();
    form.reset({
      patient_id: patientId,
      appointment_id: "",
      general_notes: "",
      items: [
        {
          name: "",
          dosage: "",
          instructions: "",
          duration: "",
        },
      ],
    });
  }, [patientId]);

  const groupedImages = useMemo(() => {
    return {
      image: images.filter((item) =>
        [
          "extraoral_front",
          "extraoral_profile",
          "extraoral_smile",
          "intraoral_upper",
          "intraoral_lower",
          "intraoral_lateral",
        ].includes(item.category)
      ),
      xray: images.filter((item) =>
        ["xray_panoramic", "xray_cephalometric", "xray_periapical"].includes(
          item.category
        )
      ),
      document: images.filter((item) =>
        ["other", "evolution"].includes(item.category)
      ),
    };
  }, [images]);

  const formatDate = (value: string | null) => {
    if (!value) return "";
    try {
      return format(new Date(value), "dd/MM/yyyy");
    } catch (error) {
      return value;
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Selecciona un archivo.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`El archivo supera los ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    console.log("category", uploadCategory);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", patientId);
    formData.append("category", uploadCategory);
    formData.append("notes", uploadNotes);
    formData.append("taken_at", uploadTakenAt);

    const response = await fetch("/api/patient-images/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      setUploadError(json?.error ?? "No se pudo subir el archivo.");
      setUploading(false);
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadNotes("");
    setUploadTakenAt("");
    setUploading(false);
    loadImages();
  };

  const onSubmitPrescription = async (values: FormValues) => {
    setError(null);
    const response = await fetch("/api/prescriptions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      setError(json?.error ?? "No se pudo guardar la receta.");
      return;
    }

    form.reset({
      patient_id: patientId,
      appointment_id: "",
      general_notes: "",
      items: [
        {
          name: "",
          dosage: "",
          instructions: "",
          duration: "",
        },
      ],
    });
    loadPrescriptions();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    const response = await fetch(`/api/patient-images?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      setError(json?.error ?? "No se pudo eliminar el archivo.");
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    loadImages();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Expediente</h2>
        <p className="text-sm text-slate-600">
          Sube imagenes, radiografias, documentos y recetas del paciente.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Categoria
            </label>
            <select
              value={uploadCategory}
              onChange={(event) =>
                setUploadCategory(
                  event.target.value as "image" | "xray" | "document"
                )
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="image">Imagen</option>
              <option value="xray">Radiografía</option>
              <option value="document">Documento</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Archivo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Fecha
            </label>
            <input
              type="date"
              value={uploadTakenAt}
              onChange={(event) => setUploadTakenAt(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Notas
            </label>
            <input
              type="text"
              value={uploadNotes}
              onChange={(event) => setUploadNotes(event.target.value)}
              placeholder="Observaciones"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {uploadError ? (
          <p className="text-sm text-red-600">{uploadError}</p>
        ) : null}

        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Subir archivo
        </button>
        <p className="text-xs text-slate-500">
          Tipos permitidos: JPG, PNG, PDF. Maximo {MAX_FILE_SIZE_MB}MB.
        </p>
      </form>

      <div className="space-y-4">
        {(["image", "xray", "document"] as const).map((category) => {
          const items = groupedImages[category];
          return (
            <div
              key={category}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {category === "image"
                    ? "Imagenes"
                    : category === "xray"
                      ? "Radiografias"
                      : "Documentos"}
                </h3>
                <span className={badgeClasses}>{CATEGORY_LABELS[category]}</span>
              </div>

              {loadingImages ? (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Cargando archivos...
                </div>
              ) : items.length === 0 ? (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No hay archivos en esta seccion.
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const url = item.cloudinary_url;
                    const isPdf = url.toLowerCase().includes(".pdf");
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                      >
                        <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">
                          {isPdf || category === "document" ? (
                            <span className="text-xs font-semibold text-slate-500">
                              PDF
                            </span>
                          ) : (
                            <img
                              src={url}
                              alt={CATEGORY_LABELS[item.category]}
                              className="h-full w-full object-cover cursor-pointer"
                              onClick={() =>
                                setSelectedImage({
                                  url,
                                  label: CATEGORY_LABELS[item.category],
                                })
                              }
                            />
                          )}
                        </div>
                        <div className="p-3 text-xs text-slate-500 space-y-1">
                          <div className="flex items-center justify-between text-[11px] uppercase">
                            <span>{CATEGORY_LABELS[item.category]}</span>
                            <span>{formatDate(item.taken_at || item.created_at)}</span>
                          </div>
                          {item.notes ? (
                            <div className="text-sm text-slate-700">
                              {item.notes}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            {isPdf || category === "document" ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                              >
                                Abrir documento
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                onClick={() =>
                                  setSelectedImage({
                                    url,
                                    label: CATEGORY_LABELS[item.category],
                                  })
                                }
                              >
                                Ver imagen
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Recetas medicas
          </h3>
          <span className={badgeClasses}>Receta</span>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmitPrescription)}
          className="space-y-4"
        >
          <input type="hidden" {...form.register("patient_id")} />

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-slate-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase text-slate-500">
                  Medicamento {index + 1}
                </h4>
                {fields.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                    onClick={() => remove(index)}
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Nombre
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    {...form.register(`items.${index}.name`)}
                  />
                  {form.formState.errors.items?.[index]?.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.items[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Dosis
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    {...form.register(`items.${index}.dosage`)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Indicaciones
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    {...form.register(`items.${index}.instructions`)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Duracion
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    {...form.register(`items.${index}.duration`)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() =>
              append({
                name: "",
                dosage: "",
                instructions: "",
                duration: "",
              })
            }
          >
            Agregar medicamento
          </button>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Notas generales
            </label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...form.register("general_notes")}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Guardar receta
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
            Historial
          </div>
          <div className="space-y-3 p-4">
            {loadingPrescriptions ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Cargando recetas...
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No hay recetas registradas.
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 uppercase">
                    <span>Receta</span>
                    <span>{formatDate(prescription.created_at)}</span>
                  </div>
                  <ul className="space-y-1">
                    {(prescription.items ?? []).map((item, index) => (
                      <li key={`${prescription.id}-${index}`}>
                        <span className="font-medium">{item.name}</span>
                        {item.dosage ? ` - ${item.dosage}` : ""}
                        {item.instructions ? ` (${item.instructions})` : ""}
                        {item.duration ? ` - ${item.duration}` : ""}
                      </li>
                    ))}
                  </ul>
                  {prescription.general_notes ? (
                    <p className="text-sm text-slate-600">
                      {prescription.general_notes}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {prescription.sent_via_whatsapp ? (
                      <span className={badgeClasses}>WhatsApp</span>
                    ) : null}
                    {prescription.printed ? (
                      <span className={badgeClasses}>Impresa</span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSelectedImage(null)}
          />
          <div className="relative max-w-4xl w-[90%] rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">
                {selectedImage.label}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-3">
              <img
                src={selectedImage.url}
                alt={selectedImage.label}
                className="max-h-[75vh] w-full object-contain rounded-md border border-slate-200"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
