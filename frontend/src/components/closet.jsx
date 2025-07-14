import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";       
import "./style.css";

const ClosetView = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchCloset = async () => {
      const user = auth.currentUser;
      if (!user) return;                             

      const idToken = await user.getIdToken();
      try {
        const res = await fetch("/get_closet_by_user", {
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
        <h2>My Closet</h2>
        <button
          className="primary-btn"
          onClick={() => navigate("/upload-item")}   // adjust route as needed
        >
          + Add Clothes
        </button>
      </div>

      {items.length === 0 ? (
        <div className="closet-empty">
          <p>Your closet is empty.</p>
          <button
            className="primary-btn"
            onClick={() => navigate("/upload-item")}
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="closet-grid">
          {items.map((cl) => (
            <div key={cl.id} className="closet-card">
              <img src={cl.image_url} alt={cl.description || "Clothing item"} />
              <div className="closet-meta">
                <span>{cl.type}</span>
                <span>{cl.color}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClosetView;
