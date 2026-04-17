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
    .select("id, token_number, status, patient_id, department, wait_time, created_at, patients(name, phone)");
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