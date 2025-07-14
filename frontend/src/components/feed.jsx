// src/components/Feed.jsx
import React, { useEffect, useState } from "react";
import { FiHeart } from "react-icons/fi";
import "./style.css";     

/* ─────────────── helper sub‑component ─────────────── */
function PostCard({ post, onToggleLike }) {
  const { id, username, avatar_url, image_url, caption, like_count, likedByMe } =
    post;

  return (
    <div className="post-card">
      {/* header */}
      <div className="post-header">
        <img src={avatar_url} alt={username} className="post-avatar" />
        <span className="post-username">{username}</span>
      </div>

      {/* image */}
      <img src={image_url} alt={caption} className="post-image" />

      {/* actions */}
      <div className="post-actions">
        <button
          className={`post-like-btn ${likedByMe ? "liked" : ""}`}
          onClick={() => onToggleLike(id)}
        >
          <FiHeart />
        </button>
        <span className="post-like-count">{like_count}</span>
      </div>

      {/* caption */}
      {caption && <p className="post-caption">{caption}</p>}
    </div>
  );
}

/* ───────────────────── main feed ───────────────────── */
export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage]   = useState(0);

  const loadFeed = async (pageNum = 0) => {
    const res   = await fetch(`/feed?page=${pageNum}`, {
      credentials: "include",
    });
    const data  = await res.json();
    setPosts((prev) =>
      pageNum === 0 ? data.posts : [...prev, ...data.posts]
    );
  };

  useEffect(() => {
    loadFeed(); 
  }, []);

  const handleToggleLike = async (postId) => {
    fetch(`/posts/${postId}/like`, { method: "POST", credentials: "include" });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              like_count: p.likedByMe ? p.like_count - 1 : p.like_count + 1,
            }
          : p
      )
    );
  };

  /* load more button */
  const loadMore = () => {
    const next = page + 1;
    loadFeed(next);
    setPage(next);
  };

  return (
    <div className="feed-container">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onToggleLike={handleToggleLike} />
      ))}

      <button className="load-more-btn" onClick={loadMore}>
        Load More
      </button>
    </div>
  );
}
