import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";       
import "./style.css";

const OOTDGenerator = () => {
  return (
    <div 
      className="ootd-generator-container" 
      style={{
        marginTop: "2rem",
        padding: "1rem",
        border: "2px dashed #6e1d9f",
        borderRadius: "12px",
        backgroundColor: "#faf7ff",
        maxWidth: "1000px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <div 
          style={{
            border: "1px dotted #6e1d9f",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
            fontWeight: "600",
            color: "#6e1d9f",
          }}
        >
          OOTD Generator
          <p style={{ fontWeight: "normal", marginTop: "0.5rem" }}>
            (Add outfit generation controls here)
          </p>
        </div>
        <div 
          style={{
            border: "1px dotted #6e1d9f",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
            fontWeight: "600",
            color: "#6e1d9f",
          }}
        >
          Closet outfit preview
          <p style={{ fontWeight: "normal", marginTop: "0.5rem" }}>
            (Show generated outfit or selected items)
          </p>
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <button 
          className="primary-btn" 
          style={{ marginRight: "1rem", padding: "8px 20px", fontSize: "0.9rem" }}
          onClick={() => alert("Try Another Outfit - Implement logic")}
        >
          TRY ANOTHER
        </button>
        <button 
          className="primary-btn"
          style={{ padding: "8px 20px", fontSize: "0.9rem" }}
          onClick={() => alert("Save Outfit - Implement logic")}
        >
          SAVE
        </button>
      </div>
    </div>
  );
};

const ClosetView = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOOTD, setShowOOTD] = useState(false);


  useEffect(() => {
    const fetchCloset = async () => {
      const user = auth.currentUser;
      if (!user) return;                             

      const idToken = await user.getIdToken();
      console.log(" Firebase ID Token:", idToken);  
      try {
        const res = await fetch("http://localhost:5000/get_closet_by_user", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        setItems(data);                           
      } catch (err) {
        console.error("Error loading closet:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCloset();
  }, []);

  // ────────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────────
  if (loading) return <div className="closet-loading">Loading…</div>;

  return (
    <div className="closet-container">
      <div className="closet-header">
        <div className="closet-title-wrapper">
          <h2>My Closet</h2>
          <button
            className="primary-btn"
            onClick={() => navigate("/upload-item")}   
          >
            + Add Clothes
          </button>

          {/* Toggle OOTD Generator Button */}
          <button
            className="primary-btn"
            onClick={() => setShowOOTD(!showOOTD)}
            style={{ marginLeft: "1rem", background: showOOTD ? "#55157d" : undefined }}
          >
            {showOOTD ? "Hide OOTD Generator" : "Show OOTD Generator"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="closet-empty">
          <p>Your closet is empty.</p>
          <button
            className="primary-btn"
            onClick={() => navigate("/upload-clothes")}

          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="closet-grid">
          {items.map((cl) => (
            <div key={cl.id} className="closet-card">
              <img className="closet-img" src={cl.image_url} alt={cl.description || "Clothing item"} />
              <div className="closet-tags">
                <span className="tag">{cl.type}</span>
                <span className="tag">{cl.color}</span>
                <span className="tag">{cl.etiquette}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OOTD Generator rendered here if toggled */}
      {showOOTD && <OOTDGenerator />}
    </div>
  );
};

export default ClosetView;