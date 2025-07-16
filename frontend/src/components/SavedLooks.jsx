import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

const API_ROOT = "http://localhost:5000";
const authedFetch = async (url) => {
  const idToken = await getAuth().currentUser.getIdToken();
  return fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
};

export default function SavedLooks() {
  const [looks, setLooks] = useState([]);
  const [selectedLook, setSelectedLook] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await authedFetch(`${API_ROOT}/looks`);
      const data = await res.json();
      setLooks(data);
    })();
  }, []);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>Saved Looks</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "1.5rem",
          marginTop: "1rem",
        }}
      >
        {looks.map((l) => (
          <div
            key={l.id}
            onClick={() => setSelectedLook(l)}
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={l.image_url}
              alt="look"
              style={{
                width: "100%",
                height: "150px",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>

      {selectedLook && (
        <div
          onClick={() => setSelectedLook(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "1rem",
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            }}
          >
            <button
              onClick={() => setSelectedLook(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#555",
              }}
            >
              &times;
            </button>
            <img
              src={selectedLook.image_url}
              alt="Full look"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
