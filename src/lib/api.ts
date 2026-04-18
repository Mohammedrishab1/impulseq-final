import { supabase } from "./supabase";

// Patients
export const getPatients = async () => {
  const { data, error } = await supabase.from("patients").select("*");
  if (error) throw error;
  return data;
};

// Queue
export const getQueue = async () => {
  const { data, error } = await supabase
    .from("queue_tokens")
    .select("id, token_number, status, patient_id, department, wait_time, created_at, patients(name, phone)");
  if (error) throw error;
  return data;
};

// ESP32 Lightweight fetch
export const getESP32Tokens = async (hospitalId: string) => {
  const { data, error } = await supabase
    .from("queue_tokens")
    .select("token_number, status")
    .eq("hospital_id", hospitalId)
    .in("status", [0, 1])
    .order("token_number", { ascending: true })
    .limit(2);
    
  if (error) throw error;
  
  const current = data.find(t => t.status === 1)?.token_number || null;
  const next = data.find(t => t.status === 0)?.token_number || null;
  
  return {
    current_token: current,
    next_token: next
  };
};

// Priority Queue
export const getPriorityQueue = async () => {
  const { data, error } = await supabase
    .from("priority_queue")
    .select(`
      id,
      priority,
      status,
      queue_tokens (
        token_number,
        department,
        created_at
      )
    `);
  if (error) throw error;
  return data;
};

// IoT Data
export const getIoTData = async () => {
  const { data, error } = await supabase.from("iot_data").select("*");
  if (error) throw error;
  return data;
};

// Hospitals
export const getHospitals = async () => {
  const { data, error } = await supabase.from("hospitals").select("*");
  if (error) throw error;
  return data;
};

// Session Recovery
export const getCurrentUser = async () => {
  try {
    // 1. Primary: Use Auth Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, hospital_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) return data;
    }

    // 2. Fallback: LocalStorage (historical/legacy)
    const userId = localStorage.getItem("user_id");
    if (!userId) return null;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, hospital_id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Auth recovery error:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Critical session failure:", err);
    return null;
  }
};