// src/components/search.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSearchDrawer } from '../contexts/SearchDrawerContext';
import { useAuth } from '../contexts/authContext';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

/* Helper: always include ID‑token */
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

/* Query the backend */
const fetchSearch = async (query = '') => {
  const url = query.trim()
    ? `http://localhost:5000/search?q=${encodeURIComponent(query.trim())}`
    : 'http://localhost:5000/search'; 
  const res = await authedFetch(url);
  if (!res.ok) throw new Error('Search failed');
  const json = await res.json();
  return json.results || [];
};

export default function SearchDrawer() {
  const { isOpen, close } = useSearchDrawer();
  const { currentUser } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  
  /* Initial suggestions (recent or top‑3) */
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      setLoading(true);
      try {
        setResults(await fetchSearch());
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  /* Debounced live search */
  useEffect(() => {
    if (!query.trim()) return;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await fetchSearch(query));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className={`fc-drawer ${isOpen ? 'open' : ''}`}>
      <header>
        <input
          autoFocus
          placeholder="Search users…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button onClick={close}>✕</button>
      </header>

      {loading && <p style={{ padding: '12px' }}>Loading…</p>}

      <ul className="results">
        {results.map(u => (
          <li key={u.id}>
            <Link
              to={`/user/${u.id}`}
              onClick={close}          /* close drawer after navigation */
              className="user-link"
            >
              <img src={u.avatar_url || '/default.png'} alt="" />
              <span>{u.username}</span>
            </Link>

            <button
              onClick={e => {
                e.stopPropagation(); // keep row clickable
                // TODO: call /follow endpoint here
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
