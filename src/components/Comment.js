import React from 'react';
import './Comment.css';

function Comment({ id, author, content, date, canModify, onEdit, onDelete }) {
  return (
    <div className="comment">
      <div className="comment-header">
        <span className="comment-author">{author}</span>
        <span className="comment-date">{date}</span>
      </div>
      <p className="comment-content">{content}</p>
      {canModify && (
        <div className="comment-actions">
          <button className="comment-edit-btn" onClick={onEdit}>
            Edit
          </button>
          <button className="comment-delete-btn" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default Comment;