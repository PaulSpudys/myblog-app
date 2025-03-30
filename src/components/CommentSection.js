import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import Comment from './Comment';
import './CommentSection.css';

function CommentSection({ postId }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch comments when the component mounts or postId changes
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const q = query(
          collection(db, 'comments'),
          where('postId', '==', postId),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedComments = [];
        
        querySnapshot.forEach((doc) => {
          fetchedComments.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setComments(fetchedComments);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError("Failed to load comments");
      }
    };
    
    if (postId) {
      fetchComments();
    }
  }, [postId]);
  
  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to post a comment");
      return;
    }
    
    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const commentData = {
        postId,
        author: currentUser.email.split('@')[0],
        content: newComment.trim(),
        userId: currentUser.uid,
        timestamp: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      
      // Add the new comment to the comments list
      setComments([
        {
          id: docRef.id,
          ...commentData
        },
        ...comments
      ]);
      
      // Clear the comment input
      setNewComment('');
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">Comments</h3>
      
      {currentUser ? (
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <textarea
            className="comment-input"
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Write a comment..."
            rows="3"
            required
          ></textarea>
          <button 
            type="submit"
            className="comment-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="comment-login-message">
          Please log in to post a comment
        </div>
      )}
      
      {error && <div className="comment-error">{error}</div>}
      
      <div className="comments-list">
        {comments.length > 0 ? (
          comments.map(comment => (
            <Comment
              key={comment.id}
              author={comment.author}
              content={comment.content}
              date={formatDate(comment.timestamp)}
            />
          ))
        ) : (
          <div className="no-comments">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;