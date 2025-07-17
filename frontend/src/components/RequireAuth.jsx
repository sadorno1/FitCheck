// src/components/RequireAuth.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { useUserProfile } from "../contexts/UserProfileContext";

export default function RequireAuth() {
  const { user, authReady }           = useAuth();
  const { profile, profileReady }     = useUserProfile();
  const location                      = useLocation();

  if (!authReady || !profileReady) {
    return <div className="closet-loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/intro" replace />;
  }

  if (!profile?.displayName && location.pathname !== "/quiz") {
    return <Navigate to="/quiz" replace />;
  }

  if (profile?.displayName && location.pathname === "/quiz") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
