import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import './AdminAddPost.css';

function SimpleAdminAddPost() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: 'him'
  });
  const [posts, setPosts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  // Load posts from localStorage on component mount
  useEffect(() => {
    const savedPosts = localStorage.getItem('blogPosts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAuthorToggle = () => {
    setFormData(prevState => ({
      ...prevState,
      author: prevState.author === 'him' ? 'her' : 'him'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitStatus('');
    
    try {
      // Create new post object for localStorage
      const newPost = {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content,
        author: formData.author,
        date: new Date().toISOString()
      };
      
      // Save to Firestore
      await addDoc(collection(db, "blogPosts"), {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        date: Timestamp.now(),
        imageUrl: null
      });
      
      // Add to local posts array
      const updatedPosts = [...posts, newPost];
      setPosts(updatedPosts);
      
      // Save to localStorage
      localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));
      
      // Show success message
      setSubmitMessage('Blog post published successfully to Firestore and localStorage!');
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        author: formData.author
      });
    } catch (error) {
      console.error("Error publishing blog post: ", error);
      setSubmitMessage('Failed to publish to Firestore. Post saved to localStorage only.');
      setSubmitStatus('error');
      
      // Even if Firestore fails, still save to localStorage
      const newPost = {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content,
        author: formData.author,
        date: new Date().toISOString()
      };
      
      const updatedPosts = [...posts, newPost];
      setPosts(updatedPosts);
      localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-post-container">
      <h2 className="admin-title">Add New Blog Post</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group author-toggle">
          <label>Author</label>
          <div className="toggle-container">
            <button
              type="button"
              className={`toggle-button ${formData.author === 'him' ? 'active' : ''}`}
              onClick={handleAuthorToggle}
            >
              His Blog
            </button>
            <button
              type="button"
              className={`toggle-button ${formData.author === 'her' ? 'active' : ''}`}
              onClick={handleAuthorToggle}
            >
              Her Blog
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="10"
            required
          ></textarea>
        </div>
        
        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Post'}
        </button>
        
        {submitMessage && (
          <div className={`submit-message ${submitStatus}`}>
            {submitMessage}
          </div>
        )}
      </form>
      
      <div className="recent-posts">
        <h3>Recently Added Posts (Stored Locally)</h3>
        {posts.length > 0 ? (
          <ul>
            {posts.map(post => (
              <li key={post.id}>
                <strong>{post.title}</strong> - {post.author === 'him' ? 'His Blog' : 'Her Blog'}
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts yet.</p>
        )}
      </div>
    </div>
  );
}

export default SimpleAdminAddPost;