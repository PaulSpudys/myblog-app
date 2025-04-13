import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [postAuthor, setPostAuthor] = useState(null);

  // Fetch post author to check if current user is post owner
  useEffect(() => {
    const fetchPostAuthor = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'blogPosts', postId));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          console.log('Fetched post for comments:', { postId, author: postData.author });
          setPostAuthor(postData.author);
        }
      } catch (err) {
        console.error('Error fetching post author:', err);
      }
    };

    fetchPostAuthor();
  }, [postId]);

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
        
        console.log('Fetched comments:', fetchedComments);
        setComments(fetchedComments);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
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
      setError('Please log in to post a comment');
      return;
    }
    
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
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
      
      console.log('Adding comment:', commentData);
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
      console.error('Error adding comment:', err);
      setError('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const commentRef = doc(db, 'comments', editingCommentId);
      console.log('Updating comment:', { id: editingCommentId, content: editContent });
      await updateDoc(commentRef, {
        content: editContent,
        timestamp: new Date()
      });
      setComments(comments.map((c) =>
        c.id === editingCommentId ? { ...c, content: editContent, timestamp: new Date() } : c
      ));
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      console.log('Deleting comment:', { id: commentId, userId: currentUser.uid });
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  const canModifyComment = (comment) => {
    if (!currentUser) return false;
    const isCommenter = comment.userId === currentUser.uid;
    const isPostAuthor = postAuthor && (
      (postAuthor === 'him' && currentUser.email === 'pauliusss_s@yahoo.com') ||
      (postAuthor === 'her' && currentUser.email === 'simonasiniauskaite@gmail.com')
    );
    console.log('canModifyComment:', { commentId: comment.id, isCommenter, isPostAuthor });
    return isCommenter || isPostAuthor;
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
        <>
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

          {editingCommentId && (
            <form className="comment-form" onSubmit={handleUpdateComment}>
              <textarea
                className="comment-input"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                rows="3"
                required
              ></textarea>
              <div className="comment-edit-actions">
                <button 
                  type="submit"
                  className="comment-submit"
                  disabled={isSubmitting}
                >
                  Save
                </button>
                <button 
                  type="button"
                  className="comment-cancel"
                  onClick={() => setEditingCommentId(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
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
              id={comment.id}
              author={comment.author}
              content={comment.content}
              date={formatDate(comment.timestamp)}
              userId={comment.userId}
              canModify={canModifyComment(comment)}
              onEdit={() => handleEditComment(comment)}
              onDelete={() => handleDeleteComment(comment.id)}
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