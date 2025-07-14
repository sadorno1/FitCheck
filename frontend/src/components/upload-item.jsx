import React, { useState } from "react";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import "./style.css";

const UploadItem = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/upload_item", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      alert("Upload successful!");
      navigate("/closet");
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Upload a Clothing Item</h2>

        <input
          type="file"
          accept="image/*"
          className="form-input"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

        <button
          className="form-button"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
};

export default UploadItem;
