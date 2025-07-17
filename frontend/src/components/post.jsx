import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { getAuth } from "firebase/auth";

/**
 * PostCreator – upload a picture, add a caption, tag closet items, post.
 * --------------------------------------------------------------------
 * Routes
 *   • GET  `${API_ROOT}/get_closet_by_user` – returns the signed‑in user’s closet
 *   • POST `${API_ROOT}/posts`              – creates a new post (multipart/form‑data)
 */

const API_ROOT = "http://localhost:5000";

// ─── helper: fetch with Firebase ID‑token ──────────────────────────────
const authedFetch = async (url, options = {}) => {
  const { currentUser } = getAuth();
  const idToken = await currentUser?.getIdToken?.();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
};

const PostCreator = () => {
  // ─── auth ────────────────────────────────────────────────────────────
  const { currentUser: ctxUser } = useAuth() ?? {};
  const fbUser = getAuth().currentUser;
  const currentUser = ctxUser || fbUser;

  const navigate = useNavigate();

  // ─── UI state ───────────────────────────────────────────────────────
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [closet, setCloset] = useState([]);      // all closet items
  const [selected, setSelected] = useState([]);  // tagged item IDs
  const [loading, setLoading] = useState(false);

  // ─── fetch closet from SQL backend ──────────────────────────────────
  useEffect(() => {
    if (!currentUser) return; // wait for sign‑in

    (async () => {
      try {
        const res = await authedFetch(`${API_ROOT}/get_closet_by_user`);
        if (!res.ok) throw new Error(`closet ${res.status}`);
        const data = await res.json();
        setCloset(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("closet fetch", err);
      }
    })();
  }, [currentUser]);

  // ─── toggle an item in the tagged list ──────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // ─── POST /posts ────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!image) return alert("Choose a picture first!");
    if (!currentUser) return alert("You must be signed in to post.");

    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("caption", caption);
      form.append("clothes", JSON.stringify(selected));

      const idToken = await currentUser.getIdToken?.();
      const res = await fetch(`${API_ROOT}/posts`, {
        method: "POST",
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        body: form,
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      navigate("/profile", { state: { fromPostSuccess: true } });
    } catch (err) {
      console.error("post", err);
      alert("Upload failed – please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── markup ─────────────────────────────────────────────────────────
  return (
    <div className="container" style={styles.container}>
      <h2 className="title" style={styles.title}>📸 Upload Your Fit</h2>
      <p className="subtitle" style={styles.subtitle}>
        Show off today’s look & tag what you’re wearing
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="fileInput"
        style={styles.fileInput}
      />

      <textarea
        className="captionInput"
        style={styles.captionInput}
        placeholder="Add a cool caption…"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      {/* closet picker */}
      {closet.length > 0 && (
        <div className="closetGrid" style={styles.closetGrid}>
          {closet.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <div
                key={item.id}
                className="closetItem"
                style={{
                  ...styles.closetItem,
                  ...(isSelected ? styles.closetItemSelected : {}),
                }}
                onClick={() => toggleSelect(item.id)}
              >
                <img src={item.image_url} alt="" style={styles.closetImage} />
                {isSelected && <span style={styles.checkmark}>✓</span>}
              </div>
            );
          })}
        </div>
      )}

      <button
        disabled={loading}
        onClick={handlePost}
        className="postButton"
        style={{
          ...styles.postButton,
          ...(loading ? styles.postButtonDisabled : {}),
        }}
      >
        {loading ? "Posting…" : "Post"}
      </button>
    </div>
  );
};

// ─── styles – simple JS object you can move to CSS/SCSS later ─────────
const styles = {
  container: {
    maxWidth: "500px",
    margin: "2rem auto",
    padding: "1.5rem",
    textAlign: "center",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: "1.8rem",
    marginBottom: "0.25rem",
    color: "#5c2a9d",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#666",
    marginBottom: "1rem",
  },
  fileInput: {
    marginBottom: "1rem",
  },
  captionInput: {
    width: "100%",
    height: "80px",
    padding: "0.5rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "1rem",
  },
  closetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "0.5rem",
    maxHeight: "200px",
    overflowY: "auto",
    marginBottom: "1.25rem",
  },
  closetItem: {
    position: "relative",
    cursor: "pointer",
    border: "2px solid black",
    borderRadius: "8px",
    background: "#f9f9f9",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  closetItemSelected: {
    borderColor: "#7b2cbf",
  },
  closetImage: {
    maxWidth: "100%",
    height: "100px",
    objectFit: "contain", 
  },
  checkmark: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "#7b2cbf",
    color: "#fff",
    fontSize: "12px",
    borderRadius: "50%",
    padding: "2px 5px",
  },
  postButton: {
    width: "100%",
    padding: "0.6rem 0",
    border: "none",
    borderRadius: "8px",
    background: "#8224e3",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  postButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

export default PostCreator;
