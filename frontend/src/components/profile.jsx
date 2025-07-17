import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { doSignOut } from "../firebase/auth";
import "./style.css";

const API_ROOT = "http://localhost:5000";

/* helper – fetch with Bearer token */
const authedFetch = async (url, opts = {}) => {
  const idToken = await auth.currentUser?.getIdToken();
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser]   = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  /* fetch profile + posts in parallel */
  useEffect(() => {
    (async () => {
      try {
        // Profile ---------------------------------------------
        const pRes = await authedFetch(`${API_ROOT}/fetch_profile`);
        if (!pRes.ok) throw new Error("profile");
        const profile = await pRes.json();
        setUser(profile);

        // Posts ------------------------------------------------
        const postRes = await authedFetch(`${API_ROOT}/fetch_posts`);
        if (!postRes.ok) throw new Error("posts");
        const postsJson = await postRes.json();
        setPosts(Array.isArray(postsJson) ? postsJson : []);
      } catch (err) {
        console.error("Profile load", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* logout */
  const handleLogout = async () => {
    await doSignOut();
    navigate("/login");
  };

  if (loading) return <div className="closet-loading">Loading…</div>;
  if (!user)    return <div className="closet-empty">Unable to load profile.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <img src={user.photoURL || "/default-avatar.png"} alt="avatar" className="profile-avatar" />
        </div>

        <div className="profile-info">
          <h2 className="profile-user">{user.displayName || "User"}</h2>
          <p className="profile-email">{user.email}</p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-actions">
            <button className="secondary-btn" onClick={() => navigate("/EditPreferences")}>Edit Preferences</button>
            <button className="secondary-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </div>

      <h3 className="profile-subtitle">My Posts</h3>

      {posts.length ? (
        <div className="closet-grid">
          {posts.map((post) => (
            <div key={post.id} className="closet-card">
              <img src={post.image_url} alt={post.caption || "Post"} className="closet-img" />
              {post.caption && (
                <div className="closet-tags"><span className="tag">{post.caption}</span></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="closet-empty"><p>You haven’t posted anything yet.</p></div>
      )}
    </div>
  );
}
