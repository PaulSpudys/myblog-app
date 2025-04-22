import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import BlogPost from '../components/BlogPost';
import CommentSection from '../components/CommentSection';
import EditPost from '../components/EditPost';
import PinterestWidget from '../components/PinterestWidget'; // Import the new component
import './BlogPage.css';

function BlogPostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!postId) {
          setError('Post ID is missing');
          setLoading(false);
          return;
        }

        const postDoc = await getDoc(doc(db, 'blogPosts', postId));
        
        if (postDoc.exists()) {
          setPost({
            id: postDoc.id,
            ...postDoc.data()
          });
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Error loading post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleEditPost = (postId) => {
    console.log('handleEditPost triggered:', { postId });
    setEditingPostId(postId);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePostUpdated = () => {
    console.log('handlePostUpdated triggered');
    setEditingPostId(null);
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'blogPosts', postId));
        if (postDoc.exists()) {
          setPost({
            id: postDoc.id,
            ...postDoc.data()
          });
        }
      } catch (err) {
        console.error('Error refreshing post:', err);
      }
    };
    fetchPost();
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (editingPostId) {
    console.log('Showing EditPost component:', { editingPostId });
    return (
      <EditPost
        postId={editingPostId}
        onCancel={() => {
          console.log('EditPost cancelled');
          setEditingPostId(null);
        }}
        onPostUpdated={handlePostUpdated}
      />
    );
  }

  if (error || !post) {
    return (
      <div className="blog-single-post-container">
        <div className="error">{error || 'Post not found'}</div>
        <button onClick={handleGoBack} className="back-button">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="blog-single-post-container">
      <button onClick={handleGoBack} className="back-button">
        ← Back
      </button>
      <div className="blog-content-wrapper">
        <div className="blog-post-main">
          <BlogPost
            id={post.id}
            title={post.title}
            date={post.date instanceof Date 
              ? post.date.toLocaleDateString() 
              : post.date.toDate 
                ? post.date.toDate().toLocaleDateString()
                : new Date(post.date).toLocaleDateString()}
            author={post.author}
            content={post.content}
            imageUrl={post.imageUrl}
            images={post.images || []}
            likes={post.likes || 0}
            hashtags={post.hashtags || []}
            onEdit={handleEditPost}
          />
          <CommentSection postId={post.id} />
        </div>
        {post.author.toLowerCase() === 'her' && (
          <aside className="blog-sidebar">
            <PinterestWidget />
          </aside>
        )}
      </div>
    </div>
  );
}

export default BlogPostPage;