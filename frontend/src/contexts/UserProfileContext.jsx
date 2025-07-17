import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getAuth } from "firebase/auth";

const API_ROOT = "http://localhost:5000";

/* helper: GET/POST with Firebase ID‑token */
const authedFetch = async (url, opts = {}) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${idToken}` },
  }).then((r) => (r.ok ? r.json() : Promise.reject(r)));
};

/* -------- context setup -------- */
const UserProfileContext = createContext();

/* Provider */
export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);   // null = not fetched yet
  const [ready, setReady] = useState(false);

  /* fetch once per Firebase‑user */
  const refreshProfile = useCallback(async () => {
    try {
      const data = await authedFetch(`${API_ROOT}/fetch_profile`);
      setProfile(data);
    } catch {
      setProfile({});          // fallback on error
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const unsub = getAuth().onAuthStateChanged((u) => {
      if (u) refreshProfile();
      else { setProfile(null); setReady(true); }
    });
    return unsub;
  }, [refreshProfile]);

  /* local updater (e.g. after quiz or settings edit) */
  const updateProfile = (patch) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  return (
    <UserProfileContext.Provider
      value={{ profile, profileReady: ready, refreshProfile, updateProfile }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

/* hook */
export const useUserProfile = () => useContext(UserProfileContext);
