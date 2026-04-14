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
    .select("*, users(name, email)");
  if (error) throw error;
  return data;
};

// Priority Queue
export const getPriorityQueue = async () => {
  const { data, error } = await supabase
    .from("priority_queue")
    .select("*, users(name, email)");
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