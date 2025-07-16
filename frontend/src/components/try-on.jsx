// TryOn.jsx — free‑form resize, robust drag coords, better deselect
// -----------------------------------------------------------------------------
// • Removed lockAspectRatio so stickers can stretch independently.
// • Trash detection now uses DOM boundingRects for *both* trash bin and
//   playground, eliminating weird jump issues.
// • Clicking empty playground area clears selection (already), and drag stays
//   smooth.

import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { getAuth } from "firebase/auth";

const auth = getAuth();
const API_ROOT = "http://localhost:5000";

const authedFetch = async (url, options = {}) => {
  const idToken = await auth.currentUser.getIdToken();
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

export default function TryOn() {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [closet, setCloset] = useState([]);
  const [stickers, setStickers] = useState([]); // {key,src,x,y,w,h,z}
  const [showPanel, setShowPanel] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  /* ---------------- Fetch avatar & closet ---------------- */
  useEffect(() => {
    (async () => {
      const res = await authedFetch(`${API_ROOT}/avatar`);
      const data = await res.json();
      const { face, bodyType } = data.avatar || {};
      if (face && bodyType) {
        setAvatarSrc(`/assets/avatars/bodies/face${face}-${bodyType}.png`);
      }
    })();
    (async () => {
      const res = await authedFetch(`${API_ROOT}/get_closet_by_user`);
      const data = await res.json();
      setCloset(data || []);
    })();
  }, []);

  /* ---------------- Sticker helpers ---------------- */
  const nextZ = () => (stickers.length ? Math.max(...stickers.map((s) => s.z)) + 1 : 1);

  const addSticker = (item) => {
    const key = Date.now();
    setStickers((p) => [
      ...p,
      { key, src: item.image_url, x: 140, y: 140, w: 100, h: 100, z: nextZ() },
    ]);
    setShowPanel(false);
    setSelectedKey(key);
  };

  const removeSticker = (key) => setStickers((p) => p.filter((s) => s.key !== key));
  const moveSticker   = (key, updates) => setStickers((p) => p.map((s) => (s.key === key ? { ...s, ...updates } : s)));
  const bringFwd      = (key) => moveSticker(key, { z: nextZ() });
  const sendBack      = (key) => moveSticker(key, { z: 0 });

  /* ---------------- Trash zone detection ---------------- */
  const isOverTrash = (x, y, w, h) => {
    const playRect  = document.getElementById("playground").getBoundingClientRect();
    const trashRect = document.getElementById("trash-bin").getBoundingClientRect();

    const sLeft   = playRect.left + x;
    const sTop    = playRect.top + y;
    const sRight  = sLeft + w;
    const sBottom = sTop + h;

    return (
      sRight > trashRect.left &&
      sLeft < trashRect.right &&
      sBottom > trashRect.top &&
      sTop < trashRect.bottom
    );
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="tryon-wrapper">
      <h1 className="tryon-title">Virtual Try‑On</h1>

      <div
        id="playground"
        className="playground"
        onMouseDown={(e) => {
          if (e.target.id === "playground") setSelectedKey(null);
        }}
      >
        {avatarSrc && <img src={avatarSrc} alt="avatar" className="avatar-img" />}

        {/* Trash bin */}
        <div id="trash-bin" className="trash-bin" title="Drag here to delete">🗑️</div>

        {stickers.map((s) => (
          <Rnd
            key={s.key}
            bounds="#playground"
            style={{ zIndex: s.z, cursor: "move" }}
            size={{ width: s.w, height: s.h }}
            position={{ x: s.x, y: s.y }}
            onDragStart={() => setSelectedKey(s.key)}
            onResizeStart={() => setSelectedKey(s.key)}
            onDragStop={(e, d) => {
              const { x, y } = d;
              if (isOverTrash(x, y, s.w, s.h)) {
                removeSticker(s.key);
              } else {
                moveSticker(s.key, { x, y });
              }
            }}
            onResizeStop={(e, dir, ref, delta, pos) => {
              const { x, y } = pos;
              const w = ref.offsetWidth;
              const h = ref.offsetHeight;
              if (isOverTrash(x, y, w, h)) {
                removeSticker(s.key);
              } else {
                moveSticker(s.key, { x, y, w, h });
              }
            }}
            // free‑form resize
          >
            <div
              className={`sticker-box ${selectedKey === s.key ? "sticker-selected" : ""}`}
              onMouseDown={() => setSelectedKey(s.key)}
            >
              <img src={s.src} alt="sticker" className="sticker-img" />
              {selectedKey === s.key && (
                <div className="layer-controls">
                  <button onClick={() => bringFwd(s.key)}>⬆</button>
                  <button onClick={() => sendBack(s.key)}>⬇</button>
                </div>
              )}
            </div>
          </Rnd>
        ))}
      </div>

      <button className="btn-primary" onClick={() => setShowPanel(!showPanel)}>
        {showPanel ? "Close" : "Add Clothes"}
      </button>

      {showPanel && (
        <div className="closet-panel">
          {closet.map((c) => (
            <button key={c.id} className="closet-item" onClick={() => addSticker(c)}>
              <img src={c.image_url} alt="item" className="closet-thumb" />
            </button>
          ))}
        </div>
      )}

      {/* ---------------- Styles ---------------- */}
      <style>{`
        :root { --play-size: 30rem; --trash-size: 52px; }
        .tryon-wrapper  { display:flex; flex-direction:column; align-items:center; gap:1.25rem; padding:1.25rem; }
        .tryon-title    { font-size:1.25rem; font-weight:600; }
        .playground     { position:relative; width:var(--play-size); height:var(--play-size); border:3px solid #6366f1; border-radius:0.75rem; background:#fff; overflow:hidden; }
        .avatar-img     { position:absolute; top:50%; left:50%; width:45%; transform:translate(-50%,-50%); user-select:none; pointer-events:none; }
        .trash-bin      { position:absolute; right:12px; bottom:12px; width:var(--trash-size); height:var(--trash-size); background:#d1d5db; color:#1f2937; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:26px; }
        .sticker-box    { width:100%; height:100%; position:relative; }
        .sticker-img    { width:100%; height:100%; object-fit:contain; }
        .sticker-selected { outline:2px dashed #6366f1; }
        .layer-controls button { background:#4b5563; color:#fff; border:none; width:22px; height:22px; font-size:13px; cursor:pointer; border-radius:3px; }
        .layer-controls { position:absolute; top:-24px; left:0; display:flex; gap:4px; }
        .btn-primary    { padding:0.5rem 1rem; background:#4f46e5; color:#fff; border-radius:0.5rem; border:none; cursor:pointer; }
        .btn-primary:hover { background:#4338ca; }
        .closet-panel   { display:grid; grid-template-columns:repeat(5,1fr); gap:0.75rem; max-width:22rem; padding:1rem; border:1px solid #e5e7eb; border-radius:0.75rem; box-shadow:0 2px 6px rgba(0,0,0,0.1); }
        .closet-item    { border:none; background:none; padding:0; cursor:pointer; border-radius:0.5rem; overflow:hidden; }
        .closet-thumb   { width:70px; height:70px; object-fit:cover; }
      `}</style>
    </div>
  );
}
