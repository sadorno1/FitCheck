// TryOn.jsx — save, load & capture looks (CORS‑safe via blob URLs)
// ----------------------------------------------------------------
import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const auth      = getAuth();
const API_ROOT  = "http://localhost:5000";

const authedFetch = async (url, options = {}) => {
  const idToken = await auth.currentUser.getIdToken();
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

const absURL = (u) =>
  u.startsWith("http") ? u : `${window.location.origin}${u}`;


export default function TryOn() {
  const [avatarSrc, setAvatarSrc]   = useState(null);
  const [closet, setCloset]         = useState([]);
  const [stickers, setStickers]     = useState([]);
  const [showPanel, setShowPanel]   = useState(false);
  const [selectedKey, setSelected]  = useState(null);
  const [saving, setSaving]         = useState(false);
  const navigate                    = useNavigate();

  /* ---- fetch avatar & closet ---- */
  useEffect(() => {
    (async () => {
      const a = await authedFetch(`${API_ROOT}/avatar`).then(r => r.json());
      const { face, bodyType } = a.avatar || {};
      if (face && bodyType) setAvatarSrc(`/assets/avatars/bodies/face${face}-${bodyType}.png`);
    })();
    (async () => {
      const data = await authedFetch(`${API_ROOT}/get_closet_by_user`).then(r => r.json());
      setCloset(data || []);
    })();
  }, []);

  /* ---- sticker helpers ---- */
  const nextZ   = () => stickers.length ? Math.max(...stickers.map(s => s.z)) + 1 : 1;

  const addSticker = async (item) => {
    const key = Date.now();
    setStickers(p => [...p, {
      key,
      src: item.image_url,         
      x: 140, y: 140, w: 100, h: 100, z: nextZ()
    }]);
    setShowPanel(false); setSelected(key);
  };

  const remove   = k   => setStickers(p => p.filter(s => s.key !== k));
  const move     = (k,u)=> setStickers(p => p.map(s => s.key===k?{...s,...u}:s));
  const bringFwd = k   => move(k,{ z: nextZ() });
  const sendBack = k   => move(k,{ z: 0       });

  /* ---- save look ---- */

const saveLook = async () => {
  if (!avatarSrc || saving) return;
  setSaving(true);
  try {
    const playRect = document
      .getElementById("playground")
      .getBoundingClientRect();

    const payload = {
      avatar: absURL(avatarSrc),
      stickers: stickers.map(s => ({ ...s, src: absURL(s.src) })),
      canvas: { w: Math.round(playRect.width),
                h: Math.round(playRect.height) }
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


  /* ---- JSX ---- */
  return (
    <div className="tryon-wrapper">
      <h1 className="tryon-title">Virtual Try‑On</h1>

      {/* playground */}
      <div id="playground" className="playground"
           onMouseDown={e => e.target.id === "playground" && setSelected(null)}>
        {avatarSrc && <img src={avatarSrc} alt="" className="avatar-img" draggable={false}/>}

        {stickers.map(s => (
          <Rnd key={s.key} bounds="#playground" style={{ zIndex:s.z, cursor:"move" }}
               size={{ width:s.w, height:s.h }} position={{ x:s.x, y:s.y }}
               enableResizing onMouseDown={() => setSelected(s.key)}
               onDrag={(e,d)=>move(s.key,{x:d.x,y:d.y})}
               onResize={(e, dir, ref, delta, pos)=>
                 move(s.key,{ x:pos.x, y:pos.y, w:ref.offsetWidth, h:ref.offsetHeight })}
          >
            <div className={`sticker-box ${selectedKey===s.key ? "sel" : ""}`}>
              <img src={s.src} alt="" className="sticker-img" draggable={false} />
              {selectedKey===s.key && (
                <>
                  <button className="del" onClick={()=>remove(s.key)}>×</button>
                  <div className="layers">
                    <button onClick={()=>bringFwd(s.key)}>⬆</button>
                    <button onClick={()=>sendBack(s.key)}>⬇</button>
                  </div>
                </>
              )}
            </div>
          </Rnd>
        ))}
      </div>

      {/* controls */}
      <div style={{ display:"flex", gap:".75rem", flexWrap:"wrap" }}>
        <button className="btn" onClick={()=>setShowPanel(!showPanel)}>
          {showPanel ? "Close" : "Add Clothes"}
        </button>
        <button className="btn" onClick={()=>navigate("/AvatarCreator")}>
          Change Avatar
        </button>
        <button className="btn" disabled={saving} onClick={saveLook}>
          {saving ? "Saving…" : "Save Look"}
        </button>
        <button className="btn" onClick={()=>navigate("/SavedLooks")}>
          View Looks
        </button>
      </div>

      {/* closet panel */}
      {showPanel && (
        <div className="panel">
          {closet.map(c => (
            <button key={c.id} className="thumb-btn" onClick={()=>addSticker(c)}>
              <img src={c.image_url} alt="" className="thumb" draggable={false}/>
            </button>
          ))}
        </div>
      )}

      {/* styles */}
      <style>{`
        :root { --play:30rem; --del:20px; }
        .tryon-wrapper{display:flex;flex-direction:column;align-items:center;gap:1.2rem;padding:1.2rem}
        .tryon-title{font-size:1.3rem;font-weight:600}
        .playground{position:relative;width:var(--play);height:var(--play);border:3px solid #6366f1;border-radius:12px;background:#fff;overflow:hidden}
        .avatar-img{position:absolute;top:50%;left:50%;width:45%;transform:translate(-50%,-50%)}
        .sticker-box{width:100%;height:100%;position:relative}
        .sticker-img{width:100%;height:100%;object-fit:fill}
        .sel{outline:2px dashed #6366f1}
        .del{position:absolute;top:6px;right:-6px;width:var(--del);height:var(--del);background:#dc2626;color:#fff;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .layers{position:absolute;top:-24px;left:0;display:flex;gap:4px}
        .layers button{background:#4b5563;color:#fff;border:none;width:22px;height:22px;font-size:13px;border-radius:3px;cursor:pointer}
        .btn{padding:.45rem 1rem;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .panel{display:grid;grid-template-columns:repeat(5,1fr);gap:.7rem;max-width:22rem;padding:1rem;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,.1)}
        .thumb-btn{border:none;background:none;padding:0;border-radius:6px;overflow:hidden;cursor:pointer}
        .thumb{width:70px;height:70px;object-fit:cover}
      `}</style>
    </div>
  );
}
