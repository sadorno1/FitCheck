import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { doSignOut } from "../firebase/auth";
import "./style.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      setUser({
        displayName: user.displayName || "User",
        photoURL: user.photoURL || "/default-avatar.png",
        email: user.email,
        bio: "Add a short bio about yourself.", // You can make this editable later
      });

      try {
        const res = await fetch("http://localhost:5000/get_my_posts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPosts();
  }, []);

  const handleLogout = async () => {
    await doSignOut();
    navigate("/login");
  };

  if (loading) return <div className="closet-loading">Loading…</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <img
            src={user.photoURL}
            alt="avatar"
            className="profile-avatar"
          />
          <button className="edit-avatar-btn">Edit Avatar</button>
        </div>

        <div className="profile-info">
          <h2 className="profile-user">{user.displayName}</h2>
          <p className="profile-email">{user.email}</p>
          <p className="profile-bio">{user.bio}</p>
          <div className="profile-actions">
            <button
              className="secondary-btn"
              onClick={() => navigate("/quiz")}
            >
              Edit Preferences
            </button>
            <button className="secondary-btn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      <h3 className="profile-subtitle">My Posts</h3>

      {posts.length === 0 ? (
        <div className="closet-empty">
          <p>You haven’t posted anything yet.</p>
        </div>
      ) : (
        <div className="closet-grid">
          {posts.map((post) => (
            <div key={post.id} className="closet-card">
              <img
                className="closet-img"
                src={post.image_url}
                alt={post.caption || "Post"}
              />
              <div className="closet-tags">
                {post.caption && <span className="tag">{post.caption}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
