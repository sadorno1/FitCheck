// src/components/Feed.jsx
import React, { useEffect, useState } from "react";
import { FiHeart } from "react-icons/fi";
import { getAuth } from "firebase/auth";
import "./style.css";

function PostCard({ post, onToggleLike }) {
  const { id, username, avatar_url, image_url, caption, like_count, likedByMe } =
    post;

  return (
    <div className="post-card">
      <div className="post-header">
        <img src={avatar_url} alt={username} className="post-avatar" />
        <span className="post-username">{username}</span>
      </div>

      <img src={image_url} alt={caption} className="post-image" />

      <div className="post-actions">
        <button
          className={`post-like-btn ${likedByMe ? "liked" : ""}`}
          onClick={() => onToggleLike(id)}
        >
          <FiHeart />
        </button>
        <span className="post-like-count">{like_count}</span>
      </div>

      {caption && <p className="post-caption">{caption}</p>}
    </div>
  );
}

export default function Feed() {
  const auth = getAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadFeed = async (pageNum = 0) => {
    setLoading(true);
    try {
      const idToken =
        auth.currentUser && (await auth.currentUser.getIdToken());

      const res = await fetch(
        `http://localhost:5000/feed?page=${pageNum}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      const data = await res.json();
      setPosts((prev) =>
        pageNum === 0 ? data.posts : [...prev, ...data.posts]
      );
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleLike = async (postId) => {
    // optimistic update
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

    try {
      const idToken =
        auth.currentUser && (await auth.currentUser.getIdToken());

      await fetch(
        `http://localhost:5000/posts/${postId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

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

      <button className="load-more-btn" onClick={loadMore} disabled={loading}>
        {loading ? "Loading…" : "Load More"}
      </button>
    </div>
  );
}
