import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, deleteDoc, updateDoc, getDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import './BlogPost.css';

export function BlogPostCard({ id, title, date, author, content, imageUrl, excerpt, likes = 0, hashtags = [] }) {
  const defaultExcerpt = !excerpt && content ? 
    content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
    excerpt;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
  };

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
        {hashtags.length > 0 && (
          <div className="blog-post-hashtags">
            {hashtags.map((tag, index) => (
              <Link key={index} to={`/tags/${tag}`} className="hashtag">
                #{tag}
              </Link>
            ))}
          </div>
        )}
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

function BlogPost({ id, title, date, author, content, imageUrl, images, likes = 0, hashtags = [], onEdit }) {
  const { currentUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [hasLiked, setHasLiked] = useState(false);
  
  // Debug log to verify props
  console.log('BlogPost props:', { id, title, date, author, content, imageUrl, images, likes, hashtags });

  const normalizedAuthor = author.toLowerCase();

  const canModify = currentUser && (
    (normalizedAuthor === 'him' && currentUser.email === 'pauliusss_s@yahoo.com') || 
    (normalizedAuthor === 'her' && currentUser.email === 'simonasiniauskaite@gmail.com')
  );

  useEffect(() => {
    const checkUserLike = async () => {
      if (!currentUser) return;
      
      try {
        const likesRef = doc(db, 'postLikes', `${id}_${currentUser.uid}`);
        const likeDoc = await getDoc(likesRef);
        setHasLiked(likeDoc.exists());
      } catch (error) {
        console.error('Error checking likes:', error);
      }
    };
    
    checkUserLike();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like posts');
      return;
    }
    
    try {
      const postRef = doc(db, 'blogPosts', id);
      const likeId = `${id}_${currentUser.uid}`;
      const likesRef = doc(db, 'postLikes', likeId);
      
      const likeDoc = await getDoc(likesRef);
      
      if (!hasLiked) {
        if (!likeDoc.exists()) {
          await updateDoc(postRef, {
            likes: increment(1)
          });
          
          await setDoc(likesRef, {
            userId: currentUser.uid,
            postId: id,
            timestamp: new Date()
          });
          
          setLikeCount(prev => prev + 1);
          setHasLiked(true);
        }
      } else {
        if (likeDoc.exists()) {
          await updateDoc(postRef, {
            likes: increment(-1)
          });
          
          await deleteDoc(likesRef);
          
          setLikeCount(prev => prev - 1);
          setHasLiked(false);
        }
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      alert('Failed to update like. Please try again.');
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
      await deleteDoc(doc(db, 'blogPosts', id));
      setIsDeleting(false);
      setShowConfirmDelete(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
  };

  const enhancedContent = content ? content.replace(
    /<img(.*?)src="([^"]+)"([^>]*)>/g, 
    '<img$1src="$2"$3 onerror="this.onerror=null; this.style.display=\'none\';">'
  ) : '';

  const showMainImage = imageUrl && !content?.includes(imageUrl);

  const displayAuthor = normalizedAuthor === 'him' ? 'Him' : 'Her';

  return (
    <div className="blog-post">
      <Helmet>
        <title>{title} - PS Media Blog</title>
        <meta name="description" content={content ? content.replace(/<[^>]*>/g, '').substring(0, 160) : ''} />
        <meta name="keywords" content={(hashtags || []).join(', ')} />
      </Helmet>
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
        {/* Removed visible hashtag rendering */}
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
          <TwitterShareButton
            url={`https://www.psmedia.pro/post/${id}`}
            title={`${title} ${hashtags.map(tag => `#${tag}`).join(' ')}`}
          >
            <TwitterIcon size={32} round />
          </TwitterShareButton>
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