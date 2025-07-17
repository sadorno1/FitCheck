import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import SavedPostCard from './SavedPostCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './style.css';

export default function Saved() {
  const auth = getAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);          

  const authedFetch = async (url, options = {}) => {
    const idToken = await auth.currentUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res  = await authedFetch('http://localhost:5000/posts/liked');
      const data = await res.json();
      setSavedPosts(data.posts || []);
      setLoading(false);
      setIndex(0);                               
    })();
  }, []);

  /** helper to go fwd/back safely */
  const go = useCallback(
    (dir) => {
      setIndex((i) =>
        savedPosts.length
          ? (i + dir + savedPosts.length) % savedPosts.length
          : 0
      );
    },
    [savedPosts.length]
  );

  /** handle keyboard arrows */
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go]);

  /** remove current outfit and advance */
  const handleToggleLike = async (postId) => {
    await authedFetch(`http://localhost:5000/posts/${postId}/like`, {
      method: 'POST',
    });
    setSavedPosts((prev) => {
      const next = prev.filter((p) => p.id !== postId);
      if (index >= next.length) setIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  if (loading) return <p>Loading…</p>;
  if (!savedPosts.length) return <p>You haven’t saved any outfits yet.</p>;

  const current = savedPosts[index];

  return (
    <div className="saved-wrapper">
      <button className="nav-btn left"  onClick={() => go(-1)}>
        <FiChevronLeft size={32} />
      </button>

      <SavedPostCard post={current} onToggleLike={handleToggleLike} />

      <button className="nav-btn right" onClick={() => go(1)}>
        <FiChevronRight size={32} />
      </button>
    </div>
  );
}
