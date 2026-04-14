import { Hospital, Queue, TokenDevice, Appointment } from '../types';

export const mockHospitals: Hospital[] = [
  { id: '1', name: 'City General Hospital', location: 'Downtown', status: 'ACTIVE', activeQueues: 12, avgWaitTime: 15, occupancy: 75, alerts: 2 },
  { id: '2', name: 'St. Mary\'s Children Hospital', location: 'North Side', status: 'BUSY', activeQueues: 18, avgWaitTime: 45, occupancy: 92, alerts: 5 },
  { id: '3', name: 'Westside Medical Center', location: 'West End', status: 'CRITICAL', activeQueues: 25, avgWaitTime: 80, occupancy: 98, alerts: 12 },
  { id: '4', name: 'Eastside Clinic', location: 'East Side', status: 'ACTIVE', activeQueues: 5, avgWaitTime: 10, occupancy: 40, alerts: 0 },
];

export const mockQueues: Queue[] = [
  { id: 'q1', tokenNumber: 'A-101', patientName: 'John Doe', department: 'OPD', doctorName: 'Dr. Smith', status: 'IN_CONSULTATION', estimatedWaitTime: 0, priority: 'NORMAL', checkInTime: '09:00 AM' },
  { id: 'q2', tokenNumber: 'A-102', patientName: 'Jane Smith', department: 'OPD', doctorName: 'Dr. Smith', status: 'WAITING', estimatedWaitTime: 15, priority: 'NORMAL', checkInTime: '09:15 AM' },
  { id: 'q3', tokenNumber: 'B-205', patientName: 'Robert Brown', department: 'Lab', status: 'WAITING', estimatedWaitTime: 30, priority: 'URGENT', checkInTime: '09:30 AM' },
  { id: 'q4', tokenNumber: 'C-301', patientName: 'Alice Wilson', department: 'Scan', status: 'DELAYED', estimatedWaitTime: 45, priority: 'NORMAL', checkInTime: '09:45 AM' },
  { id: 'q5', tokenNumber: 'E-001', patientName: 'Emergency Patient', department: 'Emergency', status: 'IN_CONSULTATION', estimatedWaitTime: 0, priority: 'EMERGENCY', checkInTime: '10:00 AM' },
];

export const mockTokenDevices: TokenDevice[] = [
  { id: 'T-001', status: 'ACTIVE', batteryLevel: 85, assignedTo: 'John Doe', department: 'OPD', lastSync: '2 mins ago' },
  { id: 'T-002', status: 'LOW_BATTERY', batteryLevel: 12, assignedTo: 'Jane Smith', department: 'OPD', lastSync: '5 mins ago' },
  { id: 'T-003', status: 'DISCONNECTED', batteryLevel: 0, lastSync: '1 hour ago' },
  { id: 'T-004', status: 'ACTIVE', batteryLevel: 98, assignedTo: 'Robert Brown', department: 'Lab', lastSync: 'Just now' },
];

export const mockAppointments: Appointment[] = [
  { id: 'ap1', patientName: 'Michael Scott', doctorName: 'Dr. House', department: 'Cardiology', time: '10:30 AM', type: 'CONSULTATION', status: 'SCHEDULED' },
  { id: 'ap2', patientName: 'Pam Beesly', doctorName: 'Dr. Grey', department: 'Pediatrics', time: '11:00 AM', type: 'FOLLOW_UP', status: 'SCHEDULED' },
  { id: 'ap3', patientName: 'Jim Halpert', doctorName: 'Dr. Watson', department: 'General Medicine', time: '11:30 AM', type: 'CONSULTATION', status: 'CHECKED_IN' },
];
