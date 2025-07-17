import React, { useEffect, useState, useMemo } from "react";
import { getAuth } from "firebase/auth";

const API_ROOT = "http://localhost:5000";

/* helper – GET with auth */
const authedFetch = async (url) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  return fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
};


export default function SavedLooks() {
  const [looks, setLooks]           = useState([]);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    (async () => {
      const res  = await authedFetch(`${API_ROOT}/looks`);
      const data = await res.json();
      setLooks(data || []);
    })();
  }, []);

  /* memo‑filter by name (case‑insensitive) */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return looks;
    return looks.filter((l) => (l.name || "Untitled Look").toLowerCase().includes(q));
  }, [looks, search]);

  return (
    <div className="galleryContainer">
      <h1 className="pageTitle">Saved Looks</h1>

      {/* search bar */}
      <input
        type="text"
        placeholder="Search looks by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="searchInput"
      />

      {/* grid */}
      <div className="grid">
        {filtered.map((l) => (
          <button
            key={l.id}
            className="thumbCard"
            onClick={() => setSelected(l)}
            title={l.name || "Untitled Look"}
          >
            <img src={l.image_url} alt={l.name} className="thumbImg" />
            <p className="thumbName">{l.name || "Untitled Look"}</p>
          </button>
        ))}
        {!filtered.length && <p style={{gridColumn:"1 / -1",textAlign:"center"}}>No looks match that name.</p>}
      </div>

      {/* modal */}
      {selected && (
        <div className="modalOverlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="closeBtn" onClick={() => setSelected(null)}>&times;</button>
            <img src={selected.image_url} alt={selected.name} className="fullImg" />
            <h2 className="lookName">{selected.name || "Untitled Look"}</h2>
            {selected.created_at && (
              <p className="lookDate">Saved on {new Date(selected.created_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}

      {/* inline styles */}
      <style>{`
        .galleryContainer { padding: 1.5rem; font-family: sans-serif; }
        .pageTitle { font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; }
        .searchInput { width: 100%; max-width: 320px; padding: 0.45rem 0.8rem; margin-bottom: 1.2rem; border:1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.5rem; }
        .thumbCard { background: #fff; border: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); cursor: pointer; overflow: hidden; transition: transform 0.2s ease; padding: 0; }
        .thumbCard:hover { transform: scale(1.05); }
        .thumbImg { width: 100%; height: 150px; object-fit: cover; display: block; }
        .thumbName { margin: 0; padding: 0.4rem; font-size: 0.9rem; text-align: center; background: #f9fafb; }

        /* modal */
        .modalOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 999; }
        .modal { background: #fff; border-radius: 12px; padding: 1rem; position: relative; max-width: 90vw; max-height: 90vh; overflow: auto; box-shadow: 0 8px 20px rgba(0,0,0,0.2); text-align: center; }
        .closeBtn { position: absolute; top: 10px; right: 10px; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #555; }
        .fullImg { width: 100%; border-radius: 8px; }
        .lookName { margin: 0.8rem 0 0.2rem; font-size: 1.2rem; font-weight: 600; }
        .lookDate { margin: 0; font-size: 0.85rem; color: #6b7280; }
      `}</style>
    </div>
  );
}
