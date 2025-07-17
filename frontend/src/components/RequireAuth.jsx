// src/components/RequireAuth.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

export default function RequireAuth() {
  const { user, authReady } = useAuth();

  // show a spinner (or null) until Firebase finishes
  if (!authReady) return <div className="closet-loading">Loading…</div>;

  // once ready, decide normally
  return user ? <Outlet /> : <Navigate to="/intro" replace />;
}
