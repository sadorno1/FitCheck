import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import SavedPostCard from './SavedPostCard';
import './style.css';

export default function Saved() {
  const auth = getAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(false);

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
      const res = await authedFetch('http://localhost:5000/posts/liked');
      const data = await res.json();
      setSavedPosts(data.posts || []);
      setLoading(false);
    })();
  }, []);

  const handleToggleLike = async (postId) => {
    // call your unlike endpoint
    await authedFetch(`http://localhost:5000/posts/${postId}/like`, {
      method: 'POST',
    });
    // remove from local list
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) return <p>Loading…</p>;
  if (savedPosts.length === 0)
    return <p>You haven’t saved any posts yet.</p>;

  return (
    <div className="saved-container">
      {savedPosts.map((post) => (
        <SavedPostCard
          key={post.id}
          post={post}
          onToggleLike={handleToggleLike}
        />
      ))}
    </div>
  );
}
