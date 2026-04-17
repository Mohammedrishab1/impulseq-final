import { supabase } from "./supabase";

export const AVG_CONSULTATION_MINUTES = 8;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  patient_id: string;
  hospital_id: string;
  doctor_id?: string;
  token_number: number;
  status: 0 | 1 | 2 | 3; // 0=waiting, 1=in-progress, 2=completed, 3=cancelled
  priority: number;
  appointment_time: string;
  estimated_minutes: number;
  created_at: string;
  // Joined fields
  users?: { name: string; email?: string };
  hospitals?: { id: string; name: string };
}

export interface Hospital {
  id: string;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns today's date range in ISO format */
function todayRange() {
  const today = new Date().toISOString().split("T")[0];
  return {
    start: `${today}T00:00:00.000Z`,
    end: `${today}T23:59:59.999Z`,
  };
}

/** Calculates estimated wait in minutes based on queue position */
export function calcETA(position: number): number {
  return position * AVG_CONSULTATION_MINUTES;
}

// ─── Hospital API ─────────────────────────────────────────────────────────────

/** Fetch all hospitals — returns empty array (not throws) on error */
export async function getHospitalsList(): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from("hospitals")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("hospitals fetch error:", error.message);
    return [];
  }
  return (data as Hospital[]) || [];
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Fetch today's appointments for a hospital.
 * Filters by appointment_time (not created_at) so bookings made yesterday
 * that are scheduled for today still appear.
 * Sorted by priority DESC → token_number ASC.
 */
export async function getAppointments(hospitalId?: string): Promise<Appointment[]> {
  const { start, end } = todayRange();

  let query = supabase
    .from("appointments")
    .select("*")
    .gte("appointment_time", start)
    .lte("appointment_time", end)
    .order("priority", { ascending: false })
    .order("token_number", { ascending: true });

  if (hospitalId && hospitalId !== "demo-hospital-id") {
    query = query.eq("hospital_id", hospitalId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getAppointments error:", error.message);
    throw error;
  }
  return (data as Appointment[]) || [];
}

/** Fetch the latest active appointment for a specific patient */
export async function getPatientActiveAppointment(
  patientId: string
): Promise<Appointment | null> {
  // Guard: don't query with a fake/demo ID
  if (!patientId || patientId === "demo-patient-id") return null;

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .in("status", [0, 1]) // active waiting or in-progress appointments
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getPatientActiveAppointment error:", error.message);
    return null;
  }

  return data && data.length > 0 ? (data[0] as Appointment) : null;
}

/** Fetch all appointments for a specific patient (history) */
export async function getPatientHistory(patientId: string, limit: number = 10, offset: number = 0): Promise<Appointment[]> {
  if (!patientId || patientId === "demo-patient-id") return [];

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .limit(limit);

  if (error) {
    console.error("getPatientHistory error:", error.message);
    throw error;
  }
  return data as Appointment[];
}

/** Book a new appointment, auto-assigning token_number and ETA */
export async function bookAppointment(params: {
  patient_id: string;
  hospital_id: string;
  doctor_id?: string;
  appointment_time: string; // must be a valid ISO string
  priority?: number;
  user_role?: number | string; // 0="Patient", 1="Admin", 2="Reception"
}): Promise<Appointment> {
  // Validate required fields before hitting the DB
  if (!params.patient_id) throw new Error("patient_id is required");
  if (!params.hospital_id) throw new Error("hospital_id is required");
  if (!params.appointment_time) throw new Error("appointment_time is required");

  // Prevent multiple active bookings
  const { data: existingRecords } = await supabase
    .from("appointments")
    .select("id")
    .eq("patient_id", params.patient_id)
    .in("status", [0, 1]) // 0=waiting, 1=in-progress
    .limit(1);

  const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

  // ✅ DEFINE ONCE HERE (GLOBAL FOR FUNCTION)
  const normalizedRole = String(params.user_role ?? "").toLowerCase();
  const canOverride = ["1", "admin", "superadmin", "super_admin", "2", "reception"].includes(normalizedRole);

  if (existing) {
    if (canOverride) {
      console.log("Admin/Reception booking override triggered. Canceling previous token:", existing.id);
      // Auto-cancel previous active appointment
      const { error } = await supabase
        .from("appointments")
        .update({ status: 3 })
        .eq("id", existing.id);
      if (error) {
        console.error("Failed to cancel existing appointment:", error.message);
        throw new Error("Override failed. Could not cancel previous appointment.");
      }
      // Re-calculate ETAs before continuing
      await recalcAllETAs(params.hospital_id);
    } else {
      throw new Error("You already have an active appointment. Please cancel it or wait until it completes before booking another.");
    }
  }

  // Validate that appointment_time is a valid date
  const apptDate = new Date(params.appointment_time);
  if (isNaN(apptDate.getTime())) throw new Error("appointment_time is not a valid date");

  // Build today's range based on the appointment date (not necessarily "today")
  const dateStr = params.appointment_time.split("T")[0];
  const rangeStart = `${dateStr}T00:00:00.000Z`;
  const rangeEnd = `${dateStr}T23:59:59.999Z`;

  // Calculate Priority Natively
  let dynamicPriority = params.priority ?? 0;
  if (!canOverride && params.priority === undefined) {
    dynamicPriority = await calculatePriority(params.patient_id);
  }

  // Count existing tokens for this hospital on the same booking day
  const { count, error: countError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", params.hospital_id)
    .gte("appointment_time", rangeStart)
    .lte("appointment_time", rangeEnd);

  if (countError) {
    console.error("token count error:", countError.message);
    throw countError;
  }

  const token_number = (count ?? 0) + 1;
  const priority = params.priority ?? 0;
  const estimated_minutes = calcETA(token_number);

  const insertPayload = {
    patient_id: params.patient_id,
    hospital_id: params.hospital_id,
    doctor_id: params.doctor_id ?? null,
    token_number,
    status: 0,
    priority: dynamicPriority,
    appointment_time: apptDate.toISOString(),
    estimated_minutes,
  };

  console.log("Inserting appointment:", insertPayload);

  const { data: inserted, error } = await supabase
    .from("appointments")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("bookAppointment insert error:", error?.message, error?.details);
    throw new Error(error?.message || "Failed to book appointment");
  }

  // Trigger ETA recalculation for everyone
  await recalcAllETAs(params.hospital_id);

  // Re-fetch the final appointment with recalculated ETA and joins
  const { data: finalAppt } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", inserted.id)
    .single();

  return finalAppt as Appointment;
}

/** Update the status of an appointment */
export async function updateStatus(id: string, status: 0 | 1 | 2 | 3, hospitalId?: string): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) throw error;

  if (hospitalId) {
    await recalcAllETAs(hospitalId);
  }
}

/** Update the priority of an appointment, then recalculate ETAs */
export async function updatePriority(
  id: string,
  priority: number,
  hospitalId: string
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ priority })
    .eq("id", id);
  if (error) throw error;
  await recalcAllETAs(hospitalId);
}

/** Recalculates estimated_minutes for all active rows of a hospital */
export async function recalcAllETAs(hospitalId: string): Promise<void> {
  const { start, end } = todayRange();

  const { data, error } = await supabase
    .from("appointments")
    .select("id, token_number, status, priority")
    .eq("hospital_id", hospitalId)
    .gte("appointment_time", start)
    .lte("appointment_time", end)
    .in("status", [0, 1])
    .order("priority", { ascending: false })
    .order("token_number", { ascending: true });

  if (error || !data) return;

  for (let idx = 0; idx < data.length; idx++) {
    await supabase
      .from("appointments")
      .update({ estimated_minutes: calcETA(idx) })
      .eq("id", data[idx].id);
  }
}

/** Cancel an appointment (mark as cancelled=3) */
export async function cancelAppointment(id: string, hospitalId?: string): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ status: 3 })
    .eq("id", id);
  if (error) throw error;

  if (hospitalId) {
    await recalcAllETAs(hospitalId);
  }
}

// ─── Triage ───────────────────────────────────────────────────────────────────

/** Calculate priority dynamically from medical records or flags */
export async function calculatePriority(patientId: string): Promise<number> {
  const { data, error } = await supabase
    .from("medical_records")
    .select("priority_flag")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return 0;
  return data[0]?.priority_flag || 0;
}

/** Update priority flag via Doctor Consultation */
export async function updatePatientMedicalPriority(patientId: string, doctorId: string, flag: number, notes: string = ""): Promise<void> {
  const { error } = await supabase
    .from("medical_records")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      notes,
      priority_flag: flag
    });

  if (error) {
    console.error("Failed to update medical history:", error.message);
    throw new Error("Failed to set medical priority");
  }
}

// ─── Real-time ────────────────────────────────────────────────────────────────

/**
 * Subscribe to appointment changes.
 * If hospitalId is a fake/demo value, subscribes without filter to catch any event.
 * Returns an unsubscribe function.
 */
export function subscribeToAppointments(
  hospitalId: string,
  callback: () => void
): () => void {
  const isRealId = hospitalId && hospitalId !== "demo-hospital-id";
  const channelName = isRealId
    ? `appointments-${hospitalId}`
    : `appointments-all`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointments",
        ...(isRealId ? { filter: `hospital_id=eq.${hospitalId}` } : {}),
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
