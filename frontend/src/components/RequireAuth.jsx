import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

const API_ROOT = "http://localhost:5000";

const authedFetch = async (url, options = {}) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

export default function RequireAuth() {
  const { user, authReady } = useAuth();
  const location            = useLocation();            
  const [displayName, setName] = useState(null);         

  useEffect(() => {
    if (authReady && user) {
      authedFetch(`${API_ROOT}/fetch_profile`)
        .then((r) => r.json())
        .then((p) => setName(p.displayName || ""))       
        .catch(() => setName(""));
    }
  }, [authReady, user, location.pathname]);               

  if (!authReady || displayName === null)
    return <div className="closet-loading">Loading…</div>;

  if (!user)                 return <Navigate to="/intro" replace />;
  if (!displayName && location.pathname !== "/quiz")
                             return <Navigate to="/quiz"  replace />;
  if (displayName && location.pathname === "/quiz")
                             return <Navigate to="/"      replace />;

  return <Outlet />;
}
