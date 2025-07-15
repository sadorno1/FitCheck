import React, { useEffect, useRef, useState } from "react";
import { FiHeart, FiChevronRight, FiUserPlus, FiPlus } from "react-icons/fi";
import { getAuth } from "firebase/auth";
import "./style.css";

function FollowCircle({ user }) {
  return (
    <div className="follow-circle">
      <img src={user.avatar_url} alt={user.username} />
      <span className="follow-name">{user.username}</span>
    </div>
  );
}

function PostCard({ post, onToggleLike }) {
  const {
    id,
    username,
    avatar_url,
    image_url,
    caption,
    like_count,
    likedByMe,
    clothes = [],
  } = post;

  return (
    <div className="post-card">
      {/* left : main photo */}
      <div className="post-main">
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

      {/* right : clothes breakdown */}
      {clothes.length > 0 && (
        <div className="post-outfit">
          {clothes.map((c) => (
            <img
              key={c.id}
              src={c.image_url}
              alt=""
              className="outfit-piece"
            />
          ))}
        </div>
      )}
    </div>
  );
}


export default function Feed() {
  const auth = getAuth();
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const stripRef = useRef(null);
  const [showArrow, setShowArrow] = useState(false);

  const authedFetch = async (url, options = {}) => {
    const idToken = await auth.currentUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${idToken}`,
      },
    });
  };

  const loadFeed = async (pageNum = 0) => {
    setLoading(true);
    try {
      const res = await authedFetch(
        `http://localhost:5000/feed?page=${pageNum}`
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

  const loadFollowing = async () => {
    try {
      const res = await authedFetch(
        "http://localhost:5000/users/me/following"
      );
      const data = await res.json();
      setFollowing(data.following || []);
      setTimeout(() => {
        const el = stripRef.current;
        setShowArrow(el && el.scrollWidth > el.clientWidth);
      }, 0);
    } catch (err) {
      console.error("Failed to load following:", err);
    }
  };

  useEffect(() => {
    loadFeed();
    loadFollowing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleLike = async (postId) => {
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
      await authedFetch(`http://localhost:5000/posts/${postId}/like`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    loadFeed(next);
    setPage(next);
  };

  const scrollRight = () => {
    stripRef.current.scrollBy({ left: 240, behavior: "smooth" });
  };

  /* -------- empty‑state helpers -------- */
  const noFriends = following.length === 0;
  const noPosts   = posts.length === 0;

  return (
    <div className="feed-container">
      {/* ── Follow strip / find‑friends button ───────────── */}
{noFriends ? (
  /* Show the single find‑friends button on top
     **only** if there ARE posts (so feed isn't empty)     */
  noPosts ? null : (
    <button
      className="find-friends-btn"
      onClick={() => alert("TODO: open search")}
    >
      <FiUserPlus /> Find friends
    </button>
  )
) : (
  /* Normal strip when you follow people */
  <div className="follow-strip-wrapper">
    <div className="follow-strip" ref={stripRef}>
      {following.map((u) => (
        <FollowCircle key={u.id} user={u} />
      ))}
    </div>
    {showArrow && (
      <button className="strip-arrow" onClick={scrollRight}>
        <FiChevronRight />
      </button>
    )}
  </div>
)}


      {/* Empty‑state vs posts list */}
      {noPosts ? (
        <div className="empty-state">
          {noFriends ? (
            <>
              <p className="empty-big">Your feed is empty</p>
              <p>Follow people or share your first look!</p>
              <div className="empty-actions">
                <button
                  className="empty-btn"
                  onClick={() => alert("TODO: open search")}
                >
                  <FiUserPlus /> Find friends
                </button>
                <button
                  className="empty-btn"
                  onClick={() => alert("TODO: open upload")}
                >
                  <FiPlus /> Post photo
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="empty-big">Nothing here… yet</p>
              <p>Your friends haven’t posted anything. Be the first!</p>
              <button
                className="empty-btn"
                onClick={() => alert("TODO: open upload")}
              >
                <FiPlus /> Post photo
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={handleToggleLike}
            />
          ))}

          <button
            className="load-more-btn"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load More"}
          </button>
        </>
      )}
    </div>
  );
}
