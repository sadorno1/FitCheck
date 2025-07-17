import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import "./style.css";

const API_ROOT = "http://localhost:5000";

/* helper – fetch with Bearer token */
const authedFetch = async (url, opts = {}) => {
  const idToken = await auth.currentUser?.getIdToken();
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

/* ------------------------------------------------------------------
 * OOTDGenerator – shows the generated / saved outfit + controls
 * ----------------------------------------------------------------*/
function OOTDGenerator({ outfit, generating, saving, viewingSaved, onTryAnother, onSave, onClose }) {
  return (
    <div className="ootd-wrap">
      <div className="ootd-header">
        <h3>Outfit of the Day</h3>
        <button className="ootd-close" onClick={onClose}>&times;</button>
      </div>

      {/* preview + controls grid */}
      <div className="ootd-grid">
        {/* preview pane */}
        <div className="ootd-preview">
          {generating ? (
            <p className="ootd-loading">Generating…</p>
          ) : (
            outfit.map((it) => (
              <img key={it.id} src={it.image_url} alt={it.description} className="ootd-img" />
            ))
          )}
        </div>

        {/* controls pane */}
        <div className="ootd-actions">
          {!viewingSaved && (
            <>
              <button className="primary-btn" onClick={onTryAnother} disabled={generating || saving}>
                {generating ? "Please wait…" : "Try Another"}
              </button>
              <button
                className="primary-btn"
                onClick={onSave}
                disabled={generating || saving || !outfit.length}
                style={{ marginTop: ".5rem" }}
              >
                {saving ? "Saving…" : "Save Outfit"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline styles specific to OOTD panel */}
      <style>{`
        .ootd-wrap{margin:1.5rem 0;padding:1rem;border:2px dashed #6e1d9f;border-radius:12px;background:#faf7ff}
        .ootd-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem}
        .ootd-header h3{margin:0;font-size:1.1rem;color:#6e1d9f}
        .ootd-close{background:none;border:none;font-size:1.4rem;cursor:pointer;color:#6e1d9f;line-height:1}
        /* --- grid layout reinstated --- */
        .ootd-grid{display:grid;grid-template-columns:1fr 160px;gap:1rem}
        .ootd-preview{display:flex;flex-direction:column;gap:.5rem;align-items:center;justify-content:center;min-height:220px}
        .ootd-img{width:140px;height:140px;object-fit:contain;border:1px solid #d1d5db;border-radius:8px;background:#fff}
        .ootd-loading,.ootd-none{color:#6b7280;text-align:center}
        .ootd-actions{display:flex;flex-direction:column;gap:.8rem;align-items:center}
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------
 * ClosetView – lists closet items and generates / saves / views OOTD
 * ----------------------------------------------------------------*/
export default function ClosetView() {
  const navigate = useNavigate();
  const [closet, setCloset] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showOOTD, setShow] = useState(false);
  const [outfit, setOutfit] = useState([]);
  const [generating, setGen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingSaved, setViewingSaved] = useState(false);

  /* fetch closet on mount */
  useEffect(() => {
    (async () => {
      const res = await authedFetch(`${API_ROOT}/get_closet_by_user`);
      const data = await res.json();
      setCloset(data || []);
      setLoading(false);
    })();
  }, []);

  /* hit /generate_ootd */
  const fetchOOTD = async () => {
    setGen(true);
    setShow(true);
    setViewingSaved(false);
    setOutfit([]);
    try {
      const res = await authedFetch(`${API_ROOT}/generate_ootd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const items = closet.filter((c) => data.outfit.includes(c.id));
      setOutfit(items);
    } catch (err) {
      console.error(err);
      alert("Error generating outfit");
      setShow(false);
    } finally {
      setGen(false);
    }
  };

  /* save outfit */
  const saveOOTD = async () => {
    if (!outfit.length) return;
    setSaving(true);
    try {
      const res = await authedFetch(`${API_ROOT}/save_ootd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfit: outfit.map((o) => o.id) }),
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Outfit saved for today!");
    } catch (err) {
      console.error(err);
      alert("Error saving outfit");
    } finally {
      setSaving(false);
    }
  };

  /* view today's saved OOTD */
  const viewSavedOOTD = async () => {
    try {
      const res = await authedFetch(`${API_ROOT}/ootd_ids`);
      if (res.status === 404) {
        alert("OOTD not saved yet.");
        return;
      }
      const data = await res.json();
      const items = closet.filter((c) => data.outfit.includes(c.id));
      setOutfit(items);
      setViewingSaved(true);
      setShow(true);
    } catch (err) {
      console.error(err);
      alert("Error fetching saved OOTD");
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) return <div className="closet-loading">Loading…</div>;

  return (
    <div className="closet-container">
      <div className="closet-header">
        <div className="closet-title-wrapper">
          <h2>My Closet</h2>
          <button className="primary-btn" onClick={() => navigate("/upload-item")}>+ Add Clothes</button>
          <button className="primary-btn" onClick={fetchOOTD} disabled={generating || saving}>
            {generating ? "Generating…" : "Generate Outfit of the Day"}
          </button>
          <button className="primary-btn" onClick={viewSavedOOTD} disabled={generating || saving}>
            View OOTD
          </button>
        </div>
      </div>

      {showOOTD && (
        <OOTDGenerator
          outfit={outfit}
          generating={generating}
          saving={saving}
          viewingSaved={viewingSaved}
          onTryAnother={fetchOOTD}
          onSave={saveOOTD}
          onClose={() => setShow(false)}
        />
      )}

      {closet.length ? (
        <div className="closet-grid">
          {closet.map((cl) => (
            <div key={cl.id} className="closet-card">
              <img src={cl.image_url} alt={cl.description} className="closet-img" />
              <div className="closet-tags">
                <span className="tag">{cl.type}</span>
                <span className="tag">{cl.color}</span>
                <span className="tag">{cl.etiquette}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="closet-empty">
          <p>Your closet is empty.</p>
          <button className="primary-btn" onClick={() => navigate("/upload-item")}>Add Your First Item</button>
        </div>
      )}
    </div>
  );
}
