// src/components/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <Outlet /> : <Navigate to="/intro" replace />;
}
