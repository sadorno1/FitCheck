import React, { useState } from "react";
import { storage, db } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

const PostUpload = () => {
  const [image, setImage] = useState(null);
  const [comment, setComment] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [likes, setLikes] = useState(0);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!image) return alert("Choose a file first!");

    try {
      const imageRef = ref(storage, `posts/${uuidv4()}-${image.name}`);
      await uploadBytes(imageRef, image);
      const url = await getDownloadURL(imageRef);
      setUploadedUrl(url);

      await addDoc(collection(db, "posts"), {
        imageUrl: url,
        comment,
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        likes: 0,
        createdAt: Timestamp.now(),
      });

      // Redirect to Profile with success message
      navigate("/profile", { state: { fromPostSuccess: true } });

    } catch (error) {
      console.error("Upload error:", error);
      alert("Something went wrong during upload.");
    }
  };

  const generateCaption = () => {
    alert("✨ Smart captions coming soon!");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📸 Upload Your Fit</h2>
      <p style={styles.subtitle}>We’re ready to see the fit ✨</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        style={styles.input}
      />

      <textarea
        placeholder="Add a caption..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={styles.textarea}
      />

      <button onClick={generateCaption} style={styles.captionBtn}>
        ✨ Generate a caption for me
      </button>

      <button onClick={handleUpload} style={styles.button}>
        Post
      </button>

      {uploadedUrl && (
        <div style={styles.preview}>
          <img src={uploadedUrl} alt="Uploaded Fit" style={styles.image} />
          <p style={styles.caption}>{comment}</p>
          <button
            onClick={() => setLikes(likes + 1)}
            style={styles.likeBtn}
          >
            ❤️ {likes}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "500px",
    margin: "auto",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "1.5rem",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "1rem",
  },
  input: {
    marginBottom: "1rem",
  },
  textarea: {
    width: "100%",
    height: "60px",
    padding: "0.5rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "0.5rem",
  },
  captionBtn: {
    marginBottom: "1rem",
    backgroundColor: "#eee",
    padding: "0.4rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    cursor: "pointer",
  },
  button: {
    padding: "0.6rem 1.5rem",
    backgroundColor: "#8224e3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "1rem",
  },
  preview: {
    marginTop: "2rem",
  },
  image: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  caption: {
    marginTop: "0.5rem",
    fontStyle: "italic",
  },
  likeBtn: {
    marginTop: "0.5rem",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
};

export default PostUpload;
