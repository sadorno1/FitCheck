// src/components/RequireAuth.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { useUserProfile } from "../contexts/UserProfileContext";

export default function RequireAuth() {
  const { user, authReady }           = useAuth();
  const { profile, profileReady }     = useUserProfile();
  const location                      = useLocation();

  /* still waiting for Firebase OR profile fetch → show spinner */
  if (!authReady || !profileReady) {
    return <div className="closet-loading">Loading…</div>;
  }

  /* not logged in → intro */
  if (!user) {
    return <Navigate to="/intro" replace />;
  }

  /* logged in but no displayName → force quiz (except when already there) */
  if (!profile?.displayName && location.pathname !== "/quiz") {
    return <Navigate to="/quiz" replace />;
  }

  /* already has displayName but somehow on /quiz → kick to feed */
  if (profile?.displayName && location.pathname === "/quiz") {
    return <Navigate to="/" replace />;
  }

  /* authenticated & profile complete → render protected routes */
  return <Outlet />;
}
