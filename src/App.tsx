/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { HospitalAdminDashboard } from './pages/HospitalAdminDashboard';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { TokenManagementDashboard } from './pages/TokenManagementDashboard';
import { LiveMonitorScreen } from './pages/LiveMonitorScreen';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { AlertsCenter } from './pages/AlertsCenter';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage, ForgotPasswordPage } from './pages/AuthPages';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminQueueDashboard } from './pages/AdminQueueDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Login & Portal */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Public / Signage Routes */}
        <Route path="/monitor" element={<LiveMonitorScreen />} />
        
        {/* Private Dashboards */}
        <Route path="/super-admin" element={
          <ProtectedRoute>
            <DashboardLayout><SuperAdminDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/hospital-admin" element={
          <ProtectedRoute>
            <DashboardLayout><HospitalAdminDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/reception" element={
          <ProtectedRoute>
            <DashboardLayout><ReceptionDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/doctor" element={
          <ProtectedRoute>
            <DashboardLayout><DoctorDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/patient" element={
          <ProtectedRoute>
            <DashboardLayout><PatientDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/tokens" element={
          <ProtectedRoute>
            <DashboardLayout><TokenManagementDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <DashboardLayout><AnalyticsDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <DashboardLayout><AlertsCenter /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout><SettingsPage /></DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/queue-admin" element={
          <ProtectedRoute>
            <DashboardLayout><AdminQueueDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Default Redirect — send unauthenticated users to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}
