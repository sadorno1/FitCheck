import React, { useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const auth     = getAuth();
const API_ROOT = "http://localhost:5000";

/* helper: fetch with Bearer token */
const authedFetch = async (url, options = {}) => {
  const idToken = await auth.currentUser.getIdToken();
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

const absURL = (u) => (u?.startsWith("http") ? u : `${window.location.origin}${u}`);


export default function TryOn() {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [closet, setCloset]       = useState([]);   
  const [stickers, setStickers]   = useState([]);   
  const [showPanel, setShowPanel] = useState(false);
  const [selected, setSelected]   = useState(null); 
  const [saving, setSaving]       = useState(false);
  const navigate                  = useNavigate();

  /* ---------- data loading ---------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    (async () => {
      // avatar
      const a = await authedFetch(`${API_ROOT}/avatar`).then((r) => r.json());
      const { face, bodyType } = a.avatar || {};
      if (face && bodyType) setAvatarSrc(`/assets/avatars/bodies/face${face}-${bodyType}.png`);

      // closet items
      const closetRes = await authedFetch(`${API_ROOT}/get_closet_by_user`).then((r) => r.json());
      const closetItems = (closetRes || []).map((c) => ({ ...c, origin: "closet" }));

      // liked posts → clothes
      const likedRes = await authedFetch(`${API_ROOT}/posts/liked`).then((r) => r.json());
      const likedClothes = (likedRes.posts || [])
        .flatMap((p) => p.clothes || [])
        .filter((c) => c && c.id && c.image_url)
        .map((c) => ({ ...c, origin: "saved" }));

      // deduplicate by id, prefer closet over saved (so closet stays tagged as closet if duplicate)
      const combined = [...closetItems, ...likedClothes];
      const uniq = Object.values(
        combined.reduce((acc, item) => {
          if (!acc[item.id]) acc[item.id] = item; 
          return acc;
        }, {})
      );
      setCloset(uniq);
    })();
  }, []);

  /* ---------- helper: next Z‑index ---------- */
  const nextZ = useCallback(() => (stickers.length ? Math.max(...stickers.map((s) => s.z)) + 1 : 1), [stickers]);

  /* ---------- add sticker ---------- */
  const addSticker = (item) => {
    const key = Date.now();
    setStickers((p) => [
      ...p,
      { key, src: item.image_url, x: 140, y: 140, w: 120, h: 120, z: nextZ() },
    ]);
    // Panel stays open until user clicks "Close"
    setSelected(key);
  };

  /* ---------- sticker operations ---------- */
  const move     = (k, u) => setStickers((p) => p.map((s) => (s.key === k ? { ...s, ...u } : s)));
  const remove   = (k)   => setStickers((p) => p.filter((s) => s.key !== k));
  const bringFwd = (k)   => move(k, { z: nextZ() });
  const sendBack = (k)   => move(k, { z: 0 });

  /* ---------- save look ---------- */
  const saveLook = async () => {
    if (!avatarSrc || saving) return;
    setSaving(true);
    try {
      const rect = document.getElementById("playground").getBoundingClientRect();
      const payload = {
        avatar: absURL(avatarSrc),
        stickers: stickers.map((s) => ({ ...s, src: absURL(s.src) })),
        canvas: { w: Math.round(rect.width), h: Math.round(rect.height) },
      };
      await authedFetch(`${API_ROOT}/looks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Look saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save look");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- JSX ---------- */
  return (
    <div className="tryonWrapper">
      <h1 className="title">Virtual Try‑On</h1>

      {/* canvas */}
      <div
        id="playground"
        className="playground"
        onMouseDown={(e) => e.target.id === "playground" && setSelected(null)}
      >
        {avatarSrc && <img src={avatarSrc} alt="avatar" className="avatar" draggable={false} />}
        {stickers.map((s) => (
          <Rnd
            key={s.key}
            bounds="#playground"
            style={{ zIndex: s.z, cursor: "move" }}
            size={{ width: s.w, height: s.h }}
            position={{ x: s.x, y: s.y }}
            enableResizing
            onMouseDown={() => setSelected(s.key)}
            onDrag={(e, d) => move(s.key, { x: d.x, y: d.y })}
            onResize={(e, dir, ref, delta, pos) =>
              move(s.key, { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight })
            }
          >
            <div className={`sticker ${selected === s.key ? "sel" : ""}`}>
              <img src={s.src} alt="garment" className="stickerImg" draggable={false} />
              {selected === s.key && (
                <>
                  <button className="del" onClick={() => remove(s.key)}>
                    ×
                  </button>
                  <div className="layers">
                    <button onClick={() => bringFwd(s.key)}>⬆</button>
                    <button onClick={() => sendBack(s.key)}>⬇</button>
                  </div>
                </>
              )}
            </div>
          </Rnd>
        ))}
      </div>

      {/* controls */}
      <div className="controls">
        <button className="btn" onClick={() => setShowPanel((v) => !v)}>
          {showPanel ? "Close" : "Add Clothes"}
        </button>
        <button className="btn" onClick={() => navigate("/AvatarCreator")}>Change Avatar</button>
        <button className="btn" disabled={saving} onClick={saveLook}>
          {saving ? "Saving…" : "Save Look"}
        </button>
        <button className="btn" onClick={() => navigate("/SavedLooks")}>View Looks</button>
      </div>

      {/* closet & saved items */}
      {showPanel && (
        <div className="panel">
          {closet.map((c) => (
            <button
              key={c.id}
              className={`thumbBtn ${c.origin === "saved" ? "savedSource" : "closetSource"}`}
              title={c.origin === "saved" ? "From a saved post" : "From your closet"}
              onClick={() => addSticker(c)}
            >
              {c.origin === "saved" && <span className="badge">★</span>}
              <img src={c.image_url} alt="thumb" className="thumb" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* inline styles */}
      <style>{`
        :root { --play: 30rem; --del: 20px; }
        .tryonWrapper { display: flex; flex-direction: column; align-items: center; gap: 1.2rem; padding: 1.2rem; }
        .title { font-size: 1.3rem; font-weight: 600; }

        /* playground */
        .playground { position: relative; width: var(--play); height: var(--play); border: 3px solid #6366f1; border-radius: 12px; background: #fff; overflow: hidden; }
        .avatar { position: absolute; top: 50%; left: 50%; width: 45%; transform: translate(-50%, -50%); }

        /* sticker on canvas */
        .sticker { width: 100%; height: 100%; position: relative; }
        .stickerImg { width: 100%; height: 100%; object-fit: fill; }
        .sel { outline: 2px dashed #6366f1; }
        .del { position: absolute; top: 6px; right: -6px; width: var(--del); height: var(--del); background: #dc2626; color: #fff; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .layers { position: absolute; top: -24px; left: 0; display: flex; gap: 4px; }
        .layers button { background: #4b5563; color: #fff; border: none; width: 22px; height: 22px; font-size: 13px; border-radius: 3px; cursor: pointer; }

        /* controls */
        .controls { display: flex; gap: .75rem; flex-wrap: wrap; }
        .btn { padding: .52rem 1.2rem; background: #4f46e5; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
        .btn:disabled { opacity: .5; cursor: not-allowed; }

        /* item panel */
        .panel { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: .8rem; max-width: 28rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 6px rgba(0, 0, 0, .1); }
        .thumbBtn { position: relative; border: none; background: none; padding: 0; border-radius: 8px; overflow: hidden; cursor: pointer; }
        .thumb { width: 100px; height: 100px; object-fit: contain; background: #f3f4f6; }
        .badge { position: absolute; top: 4px; left: 4px; background: #f59e0b; color: #fff; font-size: .65rem; padding: 0 4px; border-radius: 4px; pointer-events: none; }

        /* visual differentiation */
        .closetSource:hover { outline: 2px solid #4f46e5; }
        .savedSource:hover  { outline: 2px solid #f59e0b; }
      `}</style>
    </div>
  );
}
