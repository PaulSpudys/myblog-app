import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { BlogPostCard } from '../components/BlogPost';
import BlogPost from '../components/BlogPost';
import EditPost from '../components/EditPost';
import PinterestWidget from '../components/PinterestWidget'; // Import the new component
import './BlogPage.css';

function HerBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  const fetchPosts = async () => {
    try {
      const q = query(
        collection(db, 'blogPosts'),
        where('author', '==', 'her')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedPosts = [];
      
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      fetchedPosts.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB - dateA;
      });
      
      setPosts(fetchedPosts);
      setError(null);
    } catch (err) {
      console.error("Error fetching blog posts: ", err);
      try {
        const savedPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
        const herPosts = savedPosts.filter(post => post.author === 'her');
        herPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        setPosts(herPosts);
        setError("Using locally stored posts. Firestore connection failed.");
      } catch (localErr) {
        setError("Failed to load blog posts from any source. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleEditPost = (postId) => {
    setEditingPostId(postId);
  };

  const handlePostChanged = () => {
    setEditingPostId(null);
    fetchPosts();
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (editingPostId) {
    return (
      <EditPost 
        postId={editingPostId}
        onCancel={() => setEditingPostId(null)}
        onPostUpdated={handlePostChanged}
      />
    );
  }

  return (
    <div className="blog-page-container">
      <div className="blog-header">
        <h1 className="blog-title">Simona's Blog</h1>
        <p className="blog-description">
          Adventures, inspirations, and musings about lifestyle, travel, and creative pursuits.
        </p>
      </div>

      {error && <div className="warning">{error}</div>}

      <div className="blog-content-wrapper">
        <div className="blog-posts-grid">
          {posts.length > 0 ? (
            posts.map(post => (
              <BlogPostCard
                key={post.id}
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
                excerpt={post.excerpt}
                likes={post.likes || 0}
              />
            ))
          ) : (
            <div className="no-posts">
              <p>No blog posts found. Check back soon!</p>
            </div>
          )}
        </div>
        <aside className="blog-sidebar">
          <PinterestWidget />
        </aside>
      </div>
    </div>
  );
}

export default HerBlog;