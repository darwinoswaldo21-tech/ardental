import {
  addMinutes,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { createClient } from "@supabase/supabase-js";
import type {
  AppointmentInput,
  AppointmentUpdateInput,
} from "@/lib/validations/appointments";

type ClinicSettings = {
  opening_time: string | null;
  closing_time: string | null;
};

type AppointmentRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  patients?: { first_name?: string; last_name?: string } | null;
};

type Range = {
  start: Date;
  end: Date;
};

function parseTimeToMinutes(time: string) {
  const [h, m, s] = time.split(":").map((part) => parseInt(part, 10));
  return (h || 0) * 60 + (m || 0) + Math.floor((s || 0) / 60);
}

function getClinicHours(settings: ClinicSettings | null) {
  const opening = settings?.opening_time ?? "08:00";
  const closing = settings?.closing_time ?? "18:00";
  return {
    openingMinutes: parseTimeToMinutes(opening),
    closingMinutes: parseTimeToMinutes(closing),
  };
}

function isWithinClinicHours(
  scheduledAt: Date,
  durationMinutes: number,
  settings: ClinicSettings | null
) {
  const { openingMinutes, closingMinutes } = getClinicHours(settings);
  const startMinutes = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
  const endMinutes = startMinutes + durationMinutes;
  return startMinutes >= openingMinutes && endMinutes <= closingMinutes;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("SERVICE ROLE KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !serviceKey) {
    throw new Error("Supabase service role env vars missing");
  }
  return createClient(url, serviceKey);
}

export async function getAppointmentsByRange(range: Range) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, duration_minutes, status, type, notes, patient_id, patients(first_name,last_name)"
    )
    .gte("scheduled_at", range.start.toISOString())
    .lte("scheduled_at", range.end.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar las citas.");
  }

  return (
    data?.map((item) => ({
      ...item,
      patient: item.patients ?? null,
    })) ?? []
  );
}

export async function getAppointmentsForDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return getAppointmentsByRange({ start, end });
}

export async function getAppointmentsForWeek(date: Date) {
  return getAppointmentsByRange({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  });
}

type AppointmentValidationInput = {
  scheduled_at: string;
  duration_minutes: number;
  colleague_id?: string | null;
  created_by?: string | null;
};

export async function validateAppointment(
  input: AppointmentValidationInput,
  excludeId?: string
) {
  const supabase = createServiceClient();
  const scheduledAtLocal = new Date(input.scheduled_at);
  const duration = input.duration_minutes;
  const endsAtLocal = addMinutes(scheduledAtLocal, duration);

  const { data: settings } = await supabase
    .from("clinic_settings")
    .select("opening_time, closing_time")
    .limit(1)
    .maybeSingle();

  if (!isWithinClinicHours(scheduledAtLocal, duration, settings)) {
    return {
      ok: false,
      message: "La cita esta fuera del horario de atencion.",
    };
  }

  // Rango del dia usando fecha local, convertido a UTC al consultar
  const rangeStartLocal = new Date(
    scheduledAtLocal.getFullYear(),
    scheduledAtLocal.getMonth(),
    scheduledAtLocal.getDate(),
    0,
    0,
    0,
    0
  );
  const rangeEndLocal = new Date(
    scheduledAtLocal.getFullYear(),
    scheduledAtLocal.getMonth(),
    scheduledAtLocal.getDate(),
    23,
    59,
    59,
    999
  );

  let dayQuery = supabase
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, status, colleague_id, created_by")
    .gte("scheduled_at", rangeStartLocal.toISOString())
    .lte("scheduled_at", rangeEndLocal.toISOString());

  if (input.colleague_id !== undefined) {
    if (input.colleague_id === null) {
      dayQuery = dayQuery.is("colleague_id", null);
    } else {
      dayQuery = dayQuery.eq("colleague_id", input.colleague_id);
    }
  } else if (input.created_by) {
    dayQuery = dayQuery.eq("created_by", input.created_by);
  }

  if (excludeId) {
    dayQuery = dayQuery.neq("id", excludeId);
  }

  const { data: dayAppointments, error } = await dayQuery;

  if (error) {
    return { ok: false, message: "No se pudo validar la disponibilidad." };
  }

  const appointmentsList = (dayAppointments as AppointmentRow[]) ?? [];
  if (appointmentsList.length === 0) {
    return { ok: true };
  }

  const conflict = appointmentsList.some((appt) => {
    if (appt.status === "cancelled" || appt.status === "no_show") {
      return false;
    }
    const apptStart = new Date(appt.scheduled_at);
    const apptEnd = addMinutes(apptStart, appt.duration_minutes ?? 30);
    return overlaps(scheduledAtLocal, endsAtLocal, apptStart, apptEnd);
  });

  if (conflict) {
    return { ok: false, message: "Ya existe una cita en ese horario." };
  }

  return { ok: true };
}

export async function createAppointment(input: AppointmentInput) {
  const supabase = createServiceClient();
  const validation = await validateAppointment(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      ...input,
      scheduled_at: new Date(input.scheduled_at).toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: "No se pudo crear la cita." };
  }

  return { ok: true, id: data.id };
}

import type { AppointmentUpdateInput } from "@/lib/validations/appointments";

export async function updateAppointment(
  id: string,
  input: AppointmentUpdateInput
) {
  const supabase = createServiceClient();
  const { data: existing, error: currentError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    return { ok: false, message: "No se pudo validar la cita actual." };
  }

  if (!existing) {
    return {
      ok: false,
      message: "Appointment not found",
    };
  }

  const existingTime = new Date(existing.scheduled_at).toISOString();
  const inputTime = new Date(input.scheduled_at).toISOString();
  const existingDuration = existing.duration_minutes ?? 30;
  const inputDuration = input.duration_minutes;

  if (existingTime === inputTime && existingDuration === inputDuration) {
    const { error } = await supabase
      .from("appointments")
      .update({
        type: input.type,
        status: input.status,
        notes: input.notes ?? null,
      })
      .eq("id", id);

    if (error) {
      return { ok: false, message: "No se pudo actualizar la cita." };
    }

    return { ok: true };
  }

  const validation = await validateAppointment(
    {
      scheduled_at: input.scheduled_at,
      duration_minutes: input.duration_minutes,
      colleague_id: existing.colleague_id ?? null,
      created_by: existing.created_by ?? null,
    },
    id
  );

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      scheduled_at: new Date(input.scheduled_at).toISOString(),
      duration_minutes: input.duration_minutes,
      type: input.type,
      status: input.status,
      notes: input.notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "No se pudo actualizar la cita." };
  }

  return { ok: true };
}
