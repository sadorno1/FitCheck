// AvatarCreator.jsx — pretty layout & preview card
//--------------------------------------------------
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

const auth      = getAuth();
const API_ROOT  = "http://localhost:5000";

const faceIds   = [1, 2, 3, 4, 5, 6];
const shapes    = ["skinny", "medium", "big"];
const faceSrc   = (id)        => `/assets/avatars/faces/face${id}.png`;
const bodySrc   = (face, sh)  => `/assets/avatars/bodies/face${face}-${sh}.png`;

const authedFetch = async (url, options = {}) => {
  const idToken = await auth.currentUser.getIdToken();
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

export default function AvatarCreator() {
  const [step, setStep]     = useState(0);   // 0 → face · 1 → body · 2 → preview
  const [faceId, setFace]   = useState(null);
  const [shape,  setShape]  = useState(null);
  const navigate            = useNavigate();

  const heading = ["Pick a face", "Pick a body", "All set!"][step];
  const canNext = step === 0 ? !!faceId : !!shape;

  async function saveAvatar() {
    if (!faceId || !shape) return;
    await authedFetch(`${API_ROOT}/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ face: faceId, bodyType: shape }),
    });
    navigate("/try-on");
  }

  return (
    <div className="wrapper">
      <h1 className="title">{heading}</h1>

      {/* step 0 - face */}
      {step === 0 && (
        <div className="grid faces">
          {faceIds.map((id) => (
            <button
              key={id}
              className={`cell ${faceId === id ? "picked" : ""}`}
              onClick={() => setFace(id)}
            >
              <img src={faceSrc(id)} alt="" />
              {faceId === id && <span className="badge">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* step 1 - body */}
      {step === 1 && (
        <div className="grid">
          {shapes.map((s) => (
            <button
              key={s}
              className={`cell ${shape === s ? "picked" : ""}`}
              onClick={() => setShape(s)}
            >
              <img src={bodySrc(faceId, s)} alt="" />
              {shape === s && <span className="badge">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* step 2 - preview */}
      {step === 2 && (
        <div className="preview-card">
          <img
            src={bodySrc(faceId, shape)}
            alt="avatar"
            className="preview-img"
          />
        </div>
      )}

      {/* nav buttons */}
      <div className="btn-row">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn secondary">
            Back
          </button>
        )}
        {step < 2 && (
          <button
            disabled={!canNext}
            onClick={() => setStep(step + 1)}
            className="btn primary"
          >
            Next
          </button>
        )}
        {step === 2 && (
          <button onClick={saveAvatar} className="btn primary">
            Save &amp; Continue
          </button>
        )}
      </div>

      {/* styles */}
      <style>{`
        .wrapper      {max-width:28rem;margin:0 auto;padding:2rem 1rem;display:flex;flex-direction:column;align-items:center;gap:1.75rem;}
        .title        {font-size:1.75rem;font-weight:600;text-align:center;}
        .grid         {display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;width:100%;}
        .faces img    {width:80%;margin:10% auto;}
        .cell         {position:relative;border:3px solid transparent;border-radius:12px;overflow:hidden;cursor:pointer;transition:border .15s;}
        .cell img     {width:100%;aspect-ratio:1/1;object-fit:cover;}
        .picked       {border-color:#6e1d9f;}
        .badge        {position:absolute;top:6px;right:6px;background:#6e1d9f;color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;}
        .btn-row      {display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;}
        .btn          {padding:.55rem 1.25rem;border-radius:.5rem;font-weight:500;transition:.15s;}
        .primary      {background:#4f46e5;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.1);}
        .primary:hover{background:#4338ca;}
        .primary:disabled{opacity:.5;cursor:not-allowed;}
        .secondary    {border:1px solid #4f46e5;color:#4f46e5;}
        .secondary:hover{background:#eef2ff;}
        .preview-card {padding:1.25rem;border:2px dashed #6e1d9f;border-radius:1rem;box-shadow:0 4px 8px rgba(0,0,0,.05);}
        .preview-img  {width:7rem;height:auto;display:block;margin:0 auto;}
      `}</style>
    </div>
  );
}
