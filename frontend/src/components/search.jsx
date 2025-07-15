import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useSearchDrawer } from '../contexts/SearchDrawerContext';
import { useAuth } from '../contexts/authContext';
import { FiUserPlus } from 'react-icons/fi';

const auth = getAuth();

// Helper to attach Firebase ID‑token
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

// Query the backend for search or suggestions
const fetchSearch = async (query = '') => {
  const url = query.trim()
    ? `http://localhost:5000/search?q=${encodeURIComponent(query.trim())}`
    : 'http://localhost:5000/search';
  const res = await authedFetch(url);
  if (!res.ok) throw new Error('Search failed');
  const { results = [] } = await res.json();
  return results;
};

export default function SearchDrawer() {
  const { isOpen, close } = useSearchDrawer();
  const { currentUser } = useAuth();
  const drawerRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debug: log incoming results
  useEffect(() => {
    console.log('results →', results);
  }, [results]);

  // Close on outside click or Esc key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        close();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, close]);

  // Initial load: recent or top‑3
  useEffect(() => {
  if (!currentUser) return;
  (async () => {
    setLoading(true);
    try {
      const data = await fetchSearch();
      setResults(data);
    } finally {
      setLoading(false);
    }
  })();
}, [currentUser]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchSearch(query);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Follow/unfollow handler
  const handleToggleFollow = async (u, idx) => {
  try {
    const res = await authedFetch(
      `http://localhost:5000/users/${u.id}/follow`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('Toggle failed');

    // Option A: Flip just this one result
    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...u, isFollowing: u.isFollowing ? 0 : 1 };
      return next;
    });

    // Option B: (recommended) Re-fetch the list to get fresh data
    // const fresh = await fetchSearch(query);
    // setResults(fresh);

  } catch (err) {
    console.error(err);
  }
};

  return (
    <div ref={drawerRef} className={`fc-drawer ${isOpen ? 'open' : ''}`}>
      <header>
        <input
          autoFocus
          placeholder="Search users…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={close}>✕</button>
      </header>

      {loading && <p style={{ padding: '12px' }}>Loading…</p>}

      <ul className="results">
        {results.map((u, i) => (
          <li key={u.id}>
            <Link
              to={`/user/${u.id}`}
              onClick={close}
              className="user-link"
            >
              <img src={u.avatar_url || '/default.png'} alt="" />
              <span>{u.username}</span>
            </Link>

            <button
              className="follow-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFollow(u, i);
              }}
            >
              {u.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
