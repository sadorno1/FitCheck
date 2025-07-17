import React, { useEffect, useRef, useState } from "react";
import { FiHeart, FiChevronRight,FiChevronLeft, FiUserPlus, FiPlus, FiBookmark } from "react-icons/fi";
import { useSearchDrawer } from '../contexts/SearchDrawerContext';
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./style.css";

function FollowCircle({ user }) {
  const navigate = useNavigate();
  return (
    <div
      className="follow-circle"
      onClick={() => navigate(`/user/${user.id}`)}   
    >
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

  // slider state
  const [showOutfit, setShowOutfit] = useState(false);
  const [index, setIndex] = useState(0);

  const openSlider = (i) => {
    setIndex(i);
    setShowOutfit(true);
  };
  const next = () => setIndex((i) => (i + 1) % clothes.length);
  const prev = () => setIndex((i) => (i - 1 + clothes.length) % clothes.length);
  const close = () => setShowOutfit(false);

  return (
    <div className="post-card">
      {/* ---- left side ---- */}
      <div className="post-main">
        <div className="post-header">
          <img src={avatar_url} alt={username} className="post-avatar" />
          <span className="post-username">{username}</span>
        </div>

        <img
          src={image_url}
          alt={caption}
          className="post-image"
          onClick={close} /* tap main photo to exit slider */
        />

        <div className="post-actions">
          <button
            className={`post-like-btn ${likedByMe ? "liked" : ""}`}
            onClick={() => onToggleLike(id)}
          >
            <FiBookmark />
          </button>
          <span className="post-like-count">{like_count}</span>
        </div>

        {caption && <p className="post-caption">{caption}</p>}
      </div>

      {/* ---- right strip ---- */}
      {clothes.length > 0 && (
        <div className="post-outfit-strip">
          {clothes.map((c, i) => (
            <img
              key={c.id}
              src={c.image_url}
              alt=""
              className="outfit-thumb"
              onClick={() => openSlider(i)}
            />
          ))}
        </div>
      )}

      {/* ---- slider overlay ---- */}
      {showOutfit && (
        <div className="outfit-slider" onClick={close}>
          <button className="nav left" onClick={(e) => { e.stopPropagation(); prev(); }}>
            <FiChevronLeft />
          </button>

          <img
            src={clothes[index].image_url}
            alt=""
            className="outfit-large"
            onClick={(e) => e.stopPropagation()}
          />

          <button className="nav right" onClick={(e) => { e.stopPropagation(); next(); }}>
            <FiChevronRight />
          </button>
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
  const { open: openSearch } = useSearchDrawer();


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
      console.log("API /users/me/following →", data);

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
      {!noFriends && <span className="follow-label">Following</span>}
      
      {noFriends ? (
        <div className="follow-strip-wrapper empty">
          <button className="find-friends-btn" onClick={openSearch}>
            <FiUserPlus />
            <span>Find friends</span>
          </button>
        </div>
      ) : (
        <div className="follow-strip-wrapper">
          {/* scrollable strip */}
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
                  onClick={openSearch}
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
