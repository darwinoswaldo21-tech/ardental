"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { patientSchema } from "@/lib/validations/patients";

type PatientFormValues = z.infer<typeof patientSchema>;

type PatientFormProps = {
  mode: "create" | "edit";
  patientId?: string;
  defaultValues?: Partial<PatientFormValues>;
};

export default function PatientForm({
  mode,
  patientId,
  defaultValues,
}: PatientFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const normalizedDefaults: Partial<PatientFormValues> = {
    ...defaultValues,
    gender: defaultValues?.gender ?? "",
    blood_type: defaultValues?.blood_type ?? "",
    birth_date: defaultValues?.birth_date ?? "",
    allergies: Array.isArray(defaultValues?.allergies)
      ? defaultValues?.allergies.join(", ")
      : (defaultValues?.allergies as any) ?? "",
    current_medications: Array.isArray(defaultValues?.current_medications)
      ? defaultValues?.current_medications.join(", ")
      : (defaultValues?.current_medications as any) ?? "",
    systemic_diseases: Array.isArray(defaultValues?.systemic_diseases)
      ? defaultValues?.systemic_diseases.join(", ")
      : (defaultValues?.systemic_diseases as any) ?? "",
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      id_number: "",
      phone: "",
      email: "",
      address: "",
      birth_date: "",
      gender: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      allergies: "",
      current_medications: "",
      systemic_diseases: "",
      takes_anticoagulants: false,
      blood_type: "",
      notes: "",
      status: "active",
      ...normalizedDefaults,
    },
  });

  const onSubmit = async (values: PatientFormValues) => {
    setError(null);
    const payload = {
      ...values,
      birth_date: values.birth_date ? values.birth_date : null,
      gender: values.gender ? values.gender : null,
    };
    const endpoint =
      mode === "create" ? "/api/patients" : `/api/patients/${patientId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      setError(json?.error ?? "No se pudo guardar el paciente.");
      return;
    }

    router.replace("/patients");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nombres
          </label>
          <input
            name="first_name"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("first_name")}
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-600">
              {errors.first_name.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Apellidos
          </label>
          <input
            name="last_name"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("last_name")}
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-600">
              {errors.last_name.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Cédula
          </label>
          <input
            name="id_number"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("id_number")}
          />
          {errors.id_number && (
            <p className="mt-1 text-xs text-red-600">
              {errors.id_number.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Teléfono
          </label>
          <input
            name="phone"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>
        {mode === "edit" ? (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Dirección
            </label>
            <input
              name="address"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register("address")}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">
                {errors.address.message}
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            name="status"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("status")}
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-xs text-red-600">
              {errors.status.message}
            </p>
          )}
        </div>
      </div>

      {mode === "edit" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Fecha de nacimiento
              </label>
              <input
                name="birth_date"
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("birth_date")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Género
              </label>
              <select
                name="gender"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("gender")}
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre contacto emergencia
              </label>
              <input
                name="emergency_contact_name"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("emergency_contact_name")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Teléfono contacto emergencia
              </label>
              <input
                name="emergency_contact_phone"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("emergency_contact_phone")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Alergias (separar por comas)
              </label>
              <textarea
                name="allergies"
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("allergies")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Medicamentos actuales (separar por comas)
              </label>
              <textarea
                name="current_medications"
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("current_medications")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Enfermedades sistémicas (separar por comas)
              </label>
              <textarea
                name="systemic_diseases"
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("systemic_diseases")}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tipo de sangre
                </label>
                <input
                  name="blood_type"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  {...register("blood_type")}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  name="takes_anticoagulants"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  {...register("takes_anticoagulants")}
                />
                Usa anticoagulantes
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Notas
              </label>
              <textarea
                name="notes"
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("notes")}
              />
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {mode === "create" ? "Guardar" : "Actualizar"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
