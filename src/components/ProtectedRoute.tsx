import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Check localStorage for a custom session
  const userEmail = localStorage.getItem("user_email");
  const userRole = localStorage.getItem("user_role");

  if (!userEmail || !userRole) {
    console.log("No valid session found in localStorage. Redirecting to login...");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
