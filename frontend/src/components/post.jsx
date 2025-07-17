import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { getAuth } from "firebase/auth";

const API_ROOT = "http://localhost:5000";

// helper – authed fetch
const authedFetch = async (url, opts = {}) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

export default function PostCreator() {
  /* ---------- auth ---------- */
  const { currentUser: ctxUser } = useAuth() ?? {};
  const fbUser = getAuth().currentUser;
  const currentUser = ctxUser || fbUser;

  const navigate = useNavigate();

  /* ---------- state ---------- */
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [closet, setCloset] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------- fetch closet once ---------- */
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await authedFetch(`${API_ROOT}/get_closet_by_user`);
        const data = await res.json();
        setCloset(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("closet fetch", err);
      }
    })();
  }, [currentUser]);

  /* ---------- selection toggle ---------- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ---------- post new look ---------- */
  const handlePost = async () => {
    if (!image) return alert("Choose a picture first!");
    if (!currentUser) return alert("You must be signed in to post.");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("caption", caption);
      form.append("clothes", JSON.stringify(selected));
      const res = await authedFetch(`${API_ROOT}/posts`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error();
      navigate("/profile", { state: { fromPostSuccess: true } });
    } catch (err) {
      console.error(err);
      alert("Upload failed – please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Post OOTD ---------- */
  const postOOTD = async () => {
    try {
      const res = await authedFetch(`${API_ROOT}/ootd_ids`);
      if (res.status === 404) {
        alert("OOTD not saved yet.");
        navigate("/closet");

        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!Array.isArray(data.outfit) || !data.outfit.length) {
        alert("OOTD not saved yet.");
        return;
      }
      setSelected(data.outfit);
    } catch (err) {
      console.error(err);
      alert("Error fetching OOTD");
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="container" style={styles.container}>
      <h2 style={styles.title}>📸 Upload Your Fit</h2>
      <p style={styles.subtitle}>Tag what you’re wearing and post</p>

      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={styles.fileInput} />

      <textarea
        placeholder="Add a cool caption…"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={styles.captionInput}
      />

      {/* closet picker */}
      {!!closet.length && (
        <div style={styles.closetGrid}>
          {closet.map((c) => {
            const sel = selected.includes(c.id);
            return (
              <div
                key={c.id}
                style={{
                  ...styles.closetItem,
                  ...(sel ? styles.closetItemSelected : {}),
                }}
                onClick={() => toggleSelect(c.id)}
              >
                <img src={c.image_url} alt="" style={styles.closetImage} />
                {sel && <span style={styles.checkmark}>✓</span>}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handlePost}
        disabled={loading}
        style={{ ...styles.postButton, ...(loading ? styles.postButtonDisabled : {}) }}
      >
        {loading ? "Posting…" : "Post"}
      </button>

      <button onClick={postOOTD} style={{ ...styles.postButton, marginTop: "0.5rem", background: "#6e1d9f" }}>
        Post OOTD
      </button>
    </div>
  );
}

/* -------- styles (inline JS object) -------- */
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
  title: { fontSize: "1.8rem", marginBottom: "0.25rem", color: "#5c2a9d" },
  subtitle: { fontSize: "0.95rem", color: "#666", marginBottom: "1rem" },
  fileInput: { marginBottom: "1rem" },
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
  closetItemSelected: { borderColor: "#7b2cbf" },
  closetImage: { maxWidth: "100%", height: "100px", objectFit: "contain" },
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
  },
  postButtonDisabled: { opacity: 0.6, cursor: "not-allowed" },
};
