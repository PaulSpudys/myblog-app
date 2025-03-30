import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import BlogPost from '../components/BlogPost';
import CommentSection from '../components/CommentSection';
import './BlogPage.css';

function BlogPostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!postId) {
          setError("Post ID is missing");
          setLoading(false);
          return;
        }

        const postDoc = await getDoc(doc(db, "blogPosts", postId));
        
        if (postDoc.exists()) {
          setPost({
            id: postDoc.id,
            ...postDoc.data()
          });
        } else {
          setError("Post not found");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Error loading post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error || !post) {
    return (
      <div className="blog-single-post-container">
        <div className="error">{error || "Post not found"}</div>
        <button onClick={handleGoBack} className="back-button">
          &larr; Go back
        </button>
      </div>
    );
  }

  return (
    <div className="blog-single-post-container">
      <button onClick={handleGoBack} className="back-button">
        &larr; Back
      </button>
      <BlogPost
        id={post.id}
        title={post.title}
        date={post.date instanceof Date 
          ? post.date.toLocaleDateString() 
          : post.date.toDate 
            ? post.date.toDate().toLocaleDateString()
            : new Date(post.date).toLocaleDateString()}
        author={post.author === 'him' ? 'Him' : 'Her'}
        content={post.content}
        imageUrl={post.imageUrl}
        images={post.images || []}
        likes={post.likes || 0}
      />
      <CommentSection postId={post.id} />
    </div>
  );
}

export default BlogPostPage;