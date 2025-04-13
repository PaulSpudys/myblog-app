import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, deleteDoc, updateDoc, getDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Link } from 'react-router-dom';
import './BlogPost.css';

// This is a preview/card version of the blog post for listings
export function BlogPostCard({ id, title, date, author, content, imageUrl, excerpt, likes = 0 }) {
  // Create a text excerpt if one isn't provided
  const defaultExcerpt = !excerpt && content ? 
    content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
    excerpt;

  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none'; // Hide the image if it fails to load
  };

  // Normalize author for display
  const displayAuthor = author.toLowerCase() === 'him' ? 'Him' : 'Her';

  return (
    <div className="blog-post-card">
      <div className="blog-post-thumbnail">
        {imageUrl && <img src={imageUrl} alt={title} onError={handleImageError} />}
      </div>
      <div className="blog-post-card-content">
        <h2 className="blog-post-title">{title}</h2>
        <div className="blog-post-meta">
          <span className="blog-post-author">By {displayAuthor}</span>
          <span className="blog-post-date">{date}</span>
        </div>
        <p className="blog-post-excerpt">{defaultExcerpt}</p>
        <div className="blog-post-card-footer">
          <div className="blog-post-likes">
            <span className="like-count">❤️ {likes}</span>
          </div>
          <Link to={`/post/${id}`} className="read-more-button">Read More</Link>
        </div>
      </div>
    </div>
  );
}

// The full blog post component for individual post pages
function BlogPost({ id, title, date, author, content, imageUrl, images, likes = 0, onEdit }) {
  const { currentUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [hasLiked, setHasLiked] = useState(false);
  
  // Normalize author for logic
  const normalizedAuthor = author.toLowerCase();

  // Enhanced debug logging
  console.log('BlogPost props:', { id, title, author, normalizedAuthor, currentUserEmail: currentUser?.email, likes });

  // Check if the current user is authorized to edit/delete this post
  const canModify = currentUser && (
    (normalizedAuthor === 'him' && currentUser.email === 'pauliusss_s@yahoo.com') || 
    (normalizedAuthor === 'her' && currentUser.email === 'simonasiniauskaite@gmail.com')
  );

  console.log('canModify:', canModify, { normalizedAuthor, userEmail: currentUser?.email });

  // Check if the user has already liked this post
  useEffect(() => {
    const checkUserLike = async () => {
      if (!currentUser) return;
      
      try {
        const likesRef = doc(db, "postLikes", `${id}_${currentUser.uid}`);
        const likeDoc = await getDoc(likesRef);
        setHasLiked(likeDoc.exists());
        console.log('Checked like for post:', id, 'exists:', likeDoc.exists());
      } catch (error) {
        console.error("Error checking likes:", error);
      }
    };
    
    checkUserLike();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      alert("Please log in to like posts");
      return;
    }
    
    console.log('Handling like for post:', id, 'by user:', currentUser.uid);
    
    try {
      const postRef = doc(db, "blogPosts", id);
      const likeId = `${id}_${currentUser.uid}`;
      const likesRef = doc(db, "postLikes", likeId);
      
      // First check if the like document exists
      const likeDoc = await getDoc(likesRef);
      console.log('Like doc exists:', likeDoc.exists());
      
      if (!hasLiked) {
        // Only create a like if it doesn't already exist
        if (!likeDoc.exists()) {
          console.log('Adding like');
          await updateDoc(postRef, {
            likes: increment(1)
          });
          
          // Create the user's like document
          await setDoc(likesRef, {
            userId: currentUser.uid,
            postId: id,
            timestamp: new Date()
          });
          
          setLikeCount(prev => prev + 1);
          setHasLiked(true);
        }
      } else {
        // Remove like (only if it exists)
        if (likeDoc.exists()) {
          console.log('Removing like');
          await updateDoc(postRef, {
            likes: increment(-1)
          });
          
          // Delete the user's like record
          await deleteDoc(likesRef);
          
          setLikeCount(prev => prev - 1);
          setHasLiked(false);
        }
      }
    } catch (error) {
      console.error("Error updating likes:", error);
      alert("Failed to update like. Please try again.");
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "blogPosts", id));
      // The parent component will refetch posts after deletion
      setIsDeleting(false);
      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none'; // Hide the image if it fails to load
  };

  // Fix content to handle image errors
  const enhancedContent = content ? content.replace(
    /<img(.*?)src="([^"]+)"([^>]*)>/g, 
    '<img$1src="$2"$3 onerror="this.onerror=null; this.style.display=\'none\';">'
  ) : '';

  // Check if the image is already in the content to avoid duplicate display
  const showMainImage = imageUrl && !content?.includes(imageUrl);

  // Normalize author for display
  const displayAuthor = normalizedAuthor === 'him' ? 'Him' : 'Her';

  return (
    <div className="blog-post">
      {/* Only display the main image if it's not already in the content */}
      {showMainImage && (
        <img 
          src={imageUrl} 
          alt={title} 
          className="blog-post-image" 
          onError={handleImageError}
        />
      )}
      <div className="blog-post-content">
        <div className="blog-post-header">
          <h2 className="blog-post-title">{title}</h2>
          {canModify && (
            <div className="blog-post-actions">
              <button onClick={handleEdit} className="edit-button">
                Edit
              </button>
              <button onClick={handleDeleteClick} className="delete-button">
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="blog-post-meta">
          <span className="blog-post-author">By {displayAuthor}</span>
          <span className="blog-post-date">{date}</span>
        </div>
        
        {/* Use dangerouslySetInnerHTML to render HTML content including images */}
        <div 
          className="blog-post-body"
          dangerouslySetInnerHTML={{ __html: enhancedContent }} 
        />
        
        <div className="blog-post-footer">
          <button 
            className={`like-button ${hasLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            {hasLiked ? '❤️ Liked' : '🤍 Like'} ({likeCount})
          </button>
        </div>
      </div>
      
      {showConfirmDelete && (
        <div className="delete-confirmation">
          <p>Are you sure you want to delete this post?</p>
          <div className="confirmation-buttons">
            <button 
              onClick={handleConfirmDelete} 
              className="confirm-delete-button"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button 
              onClick={handleCancelDelete} 
              className="cancel-delete-button"
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogPost;