//it doesnt work yet
import React, { useState, useEffect } from 'react';
import './style.css';    

export default function ClosetView() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/get_closet_by_user', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => setItems(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p>Error loading closet: {error}</p>;
  if (items === null) return <p>Loading…</p>;
  if (items.length === 0) return <p>Your closet is empty.</p>;

  return (
    <div className="closet-grid">
      {items.map(item => (
        <div key={item.id} className="closet-item">
          <img src={item.imageUrl} alt={item.name} />
          <div>{item.name}</div>
        </div>
      ))}
    </div>
  );
}
