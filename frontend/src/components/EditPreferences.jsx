import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "./style.css";

const API_ROOT = "http://localhost:5000";

// ─── helper: authed fetch ───────────────────────────────────────────
const authedFetch = async (url, opts = {}) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

const GENDERS = ["Female", "Male", "Non‑binary", "Prefer not to say"];

export default function EditPreferences() {
  const navigate = useNavigate();

  const [pref, setPref] = useState({
    displayName: "",
    age: "",
    gender: "",
    bio: "",
    style: "", // comma‑separated keywords
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]  = useState(false);

  // ─── load current profile ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await authedFetch(`${API_ROOT}/fetch_profile`);
        const data = await res.json();
        setPref({
          displayName: data.displayName || "",
          age:         data.age         || "",
          gender:      data.gender      || "",
          bio:         data.bio         || "",
          style:       data.style       || "",
        });
      } catch (err) {
        console.error(err);
        alert("Could not load preferences");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── submit ───────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      const res = await authedFetch(`${API_ROOT}/update_preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pref),
      });
      if (!res.ok) throw new Error();
      alert("Preferences saved!");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="closet-loading">Loading…</div>;

  return (
    <div className="pref-wrapper">
      <h2 className="pref-title">Edit Preferences</h2>

      <label className="pref-label">
        Username
        <input
          className="pref-input"
          type="text"
          value={pref.displayName}
          onChange={(e) => setPref({ ...pref, displayName: e.target.value })}
        />
      </label>

      <label className="pref-label">
        Age
        <input
          className="pref-input"
          type="number"
          min="1"
          max="120"
          value={pref.age}
          onChange={(e) => setPref({ ...pref, age: e.target.value })}
        />
      </label>

      <label className="pref-label">
        Gender
        <select
          className="pref-select"
          value={pref.gender}
          onChange={(e) => setPref({ ...pref, gender: e.target.value })}
        >
          <option value="">Select…</option>
          {GENDERS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>

      <label className="pref-label">
        Style keywords <span className="helper">(comma‑separated: minimalist, retro)</span>
        <input
          className="pref-input"
          type="text"
          value={pref.style}
          onChange={(e) => setPref({ ...pref, style: e.target.value })}
        />
      </label>

      <label className="pref-label">
        Bio
        <textarea
          className="pref-textarea"
          rows={3}
          value={pref.bio}
          onChange={(e) => setPref({ ...pref, bio: e.target.value })}
        />
      </label>

      <button
        className="primary-btn pref-save"
        disabled={saving}
        onClick={save}
      >
        {saving ? "Saving…" : "Save"}
      </button>

      {/* inline beautification */}
      <style>{`
        .pref-wrapper{max-width:560px;margin:3rem auto;padding:2rem;background:#fff7fb;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.06);}
        .pref-title{font-size:1.9rem;margin-bottom:1.2rem;color:#6e1d9f;text-align:center;font-weight:700}
        .pref-label{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1.2rem;font-weight:600;color:#4b5563}
        .pref-input,.pref-select,.pref-textarea{padding:.55rem .75rem;border:1px solid #cbd5e1;border-radius:8px;font-size:1rem;font-family:inherit}
        .pref-input:focus,.pref-select:focus,.pref-textarea:focus{outline:none;border-color:#7b2cbf;box-shadow:0 0 0 2px rgba(123,44,191,.2)}
        .pref-textarea{resize:vertical;min-height:90px}
        .helper{font-size:.8rem;font-weight:400;color:#6b7280}
        .pref-save{width:100%;margin-top:.5rem}
      `}</style>
    </div>
  );
}
