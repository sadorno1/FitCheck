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
      </div>
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
    </div>
  );
};

export default ClosetView;
