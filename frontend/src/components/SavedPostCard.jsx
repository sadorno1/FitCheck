import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

export default function SavedPostCard({ post, onToggleLike }) {
  const { id, clothes = [] } = post;

  return (
    <div className="saved-card">
      {/* ---- show clothes thumbnails instead of main post image ---- */}
      <div className="saved-clothes-strip">
  {clothes.map((c) => (
    <div key={c.id} className="saved-clothes-thumb">
      <img src={c.image_url} alt="" />
    </div>
  ))}
</div>

      <div className="saved-actions">
        {/* Remove from saved */}
        <button
          className="saved-remove-btn"
          onClick={() => onToggleLike(id)}
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
}
