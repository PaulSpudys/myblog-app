import React from 'react';
import './Comment.css';

function Comment({ author, content, date }) {
  return (
    <div className="comment">
      <div className="comment-header">
        <span className="comment-author">{author}</span>
        <span className="comment-date">{date}</span>
      </div>
      <div className="comment-content">{content}</div>
    </div>
  );
}

export default Comment;