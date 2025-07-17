import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "./style.css";

const API_ROOT = "http://localhost:5000";

/* helper – fetch with bearer token */
const authedFetch = async (url, opts = {}) => {
  const idToken = await getAuth().currentUser?.getIdToken();
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

export default function OtherUserProfile() {
  const { id }      = useParams();            // /user/:id
  const navigate    = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoad]   = useState(true);

  /* fetch public profile + posts */
  useEffect(() => {
    (async () => {
      try {
        const pRes = await authedFetch(`${API_ROOT}/public_profile/${id}`);
        if (!pRes.ok) throw new Error("404");
        const pData = await pRes.json();

        const postRes = await authedFetch(`${API_ROOT}/public_posts/${id}`);
        const postData = await postRes.json();

        setProfile(pData);
        setPosts(Array.isArray(postData) ? postData : []);
      } catch (err) {
        console.error(err);
        setProfile(null);
      } finally {
        setLoad(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="closet-loading">Loading…</div>;
  if (!profile)  return (
    <div className="closet-empty" style={{textAlign:"center"}}>
      <p>User not found.</p>
      <button className="primary-btn" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
const avatar = profile.photoURL || profile.avatar_url || "/default-avatar.png";


  return (
    <div className="profile-container">
      {/* ---- header ---- */}
      <div className="profile-header">
        <div className="profile-avatar-section">
        <img src={avatar} alt={profile.username} className="profile-avatar" />
        </div>

        <div className="profile-info">
          <h2 className="profile-user">{profile.username || profile.displayName}</h2>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>
      </div>

      <h3 className="profile-subtitle">Posts</h3>

      {posts.length === 0 ? (
        <div className="closet-empty">
          <p>This user hasn’t posted anything yet.</p>
        </div>
      ) : (
        <div className="closet-grid">
          {posts.map((post) => (
            <div key={post.id} className="closet-card">
              <img className="closet-img" src={post.image_url} alt={post.caption || "Post"} />
              {post.caption && (
                <div className="closet-tags">
                  <span className="tag">{post.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
