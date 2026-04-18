import { supabase } from "./supabase";

export interface QueueToken {
  id: string;
  patient_id: string;
  hospital_id: string;
  token_number: number;
  status: 0 | 1 | 2 | 3;
  created_at: string;
  patients?: { name: string; phone?: string }; // joined field
}

export const fetchQueue = async (hospitalId: string): Promise<QueueToken[]> => {
  if (!hospitalId) return [];
  
  const { data, error } = await supabase
    .from("queue_tokens")
    .select("id, token_number, status, patient_id, patients(name, phone)") // optimized minimal fetch
    .eq("hospital_id", hospitalId)
    .in("status", [0, 1]) // Only fetch waiting and in-progress for display
    .order("token_number", { ascending: true })
    .limit(20);

  if (error) {
    console.error("Error fetching queue:", error.message);
    throw error;
  }
  return data as any[];
};

export const createToken = async (hospitalId: string, patientId: string): Promise<void> => {
  if (!hospitalId || !patientId) {
    throw new Error("Invalid Hospital or Patient ID");
  }

  const { error } = await supabase.rpc("create_queue_token", {
    p_patient_id: patientId,
    p_hospital_id: hospitalId,
  });

  if (error) {
    console.error("Full Supabase RPC Error:", error);
    
    // Requirement 7: Specific error handling
    if (error.message.toLowerCase().includes("duplicate key")) {
      throw new Error("Token already exists or patient already in queue");
    }
    if (error.message.toLowerCase().includes("row-level security") || error.code === '42501') {
      throw new Error("Permission denied. Please login again.");
    }
    // Network errors usually manifest as failed fetches or specific codes
    if (error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("fetch")) {
      throw new Error("Network issue. Try again.");
    }
    throw error;
  }
};

export const callNextToken = async (hospitalId: string): Promise<void> => {
  // 1. Mark current active token as completed (status = 2)
  const { error: completeError } = await supabase
    .from("queue_tokens")
    .update({ status: 2 })
    .eq("hospital_id", hospitalId)
    .eq("status", 1);
    
  if (completeError) {
    console.error("Failed to complete old token", completeError);
    // Continue anyway to prevent queue block
  }

  // 2. Fetch the next waiting token (status = 0 and lowest token_number)
  const { data: nextTokens, error: nextError } = await supabase
    .from("queue_tokens")
    .select("id")
    .eq("hospital_id", hospitalId)
    .eq("status", 0)
    .order("token_number", { ascending: true })
    .limit(1);

  if (nextError) {
    if (nextError.code === '42501') throw new Error("Permission denied. Please login again.");
    throw nextError;
  }

  if (nextTokens && nextTokens.length > 0) {
    // 3. Mark it as active (status = 1)
    const { error: activeError } = await supabase
      .from("queue_tokens")
      .update({ status: 1 })
      .eq("id", nextTokens[0].id);

    if (activeError) {
      if (activeError.code === '42501') throw new Error("Permission denied. Please login again.");
      throw activeError;
    }
  } else {
    throw new Error("No patients waiting in queue");
  }
};

// ─── DYNAMIC ESP32 QUEUE INTEGRATION ──────────────────────────────────────────

export interface PatientQueueEntry {
  id: string;
  name: string;
  priority: 'emergency' | 'senior' | 'normal';
  status: 'waiting' | 'in-progress' | 'completed';
  created_at: string;
}

export interface PatientQueueWithToken extends PatientQueueEntry {
  token_number: number;
}

export const getQueueWithTokens = async (): Promise<PatientQueueWithToken[]> => {
  const { data, error } = await supabase
    .from("patients_queue")
    .select("*")
    .in("status", ["waiting", "in-progress"])
    .order("created_at", { ascending: true }); // Base time sort

  if (error) {
     console.error(error);
     // Fallback / ignore to avoid crashing if table not created
     return [];
  }
  
  if (!data) return [];

  // Sort by priority -> Emergency > Senior > Normal
  const priorityMap: Record<string, number> = { 'emergency': 3, 'senior': 2, 'normal': 1 };
  
  const sortedQueue = (data as PatientQueueEntry[]).sort((a, b) => {
    // If one is in-progress, they are at the top (token 0 or currently serving)
    if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
    if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;

    const pA = priorityMap[a.priority] || 1;
    const pB = priorityMap[b.priority] || 1;
    if (pA !== pB) {
      return pB - pA; // Descending
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Assign Tokens dynamically based on index
  return sortedQueue.map((patient, index) => ({
    ...patient,
    token_number: index + 1
  }));
};

export const addPatientToQueue = async (patient: Omit<PatientQueueEntry, 'id' | 'created_at' | 'status'>): Promise<PatientQueueEntry> => {
  const { data, error } = await supabase
    .from("patients_queue")
    .insert({
      name: patient.name,
      priority: patient.priority,
      status: 'waiting'
    })
    .select()
    .single();

  if (error) throw error;
  return data as PatientQueueEntry;
};

export const completeCurrentPatient = async (): Promise<void> => {
  // Mark current active patient as completed
  const { data: inProgressPatients } = await supabase
    .from("patients_queue")
    .select("id")
    .eq("status", "in-progress");

  if (inProgressPatients && inProgressPatients.length > 0) {
    for (const p of inProgressPatients) {
      await supabase
        .from("patients_queue")
        .update({ status: "completed" })
        .eq("id", p.id);
    }
  }

  // Find next in queue to make active
  const queue = await getQueueWithTokens();
  const nextUp = queue.find(q => q.status === 'waiting');
  
  if (nextUp) {
    await supabase
      .from("patients_queue")
      .update({ status: "in-progress" })
      .eq("id", nextUp.id);
  }
};

