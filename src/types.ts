/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';

export interface Hospital {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BUSY' | 'CRITICAL';
  activeQueues: number;
  avgWaitTime: number;
  occupancy: number;
  alerts: number;
}

export interface Queue {
  id: string;
  tokenNumber: string;
  patientName: string;
  department: string;
  doctorName?: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'DELAYED' | 'MISSED';
  estimatedWaitTime: number; // in minutes
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  checkInTime: string;
}

export interface TokenDevice {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOW_BATTERY' | 'DISCONNECTED';
  batteryLevel: number;
  assignedTo?: string; // Patient ID or Name
  department?: string;
  lastSync: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  time: string;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'LAB_TEST' | 'SCAN';
  status: 'SCHEDULED' | 'CHECKED_IN' | 'CANCELLED';
}
