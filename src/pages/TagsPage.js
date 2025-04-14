import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { BlogPostCard } from '../components/BlogPost';
import './TagsPage.css';

function TagsPage() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, 'blogPosts'),
          where('hashtags', 'array-contains', tag)
        );
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);
      } catch (err) {
        console.error('Error fetching tagged posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [tag]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="tags-page">
      <h2>Posts tagged #{tag}</h2>
      {posts.length > 0 ? (
        <div className="post-list">
          {posts.map(post => (
            <BlogPostCard
              key={post.id}
              id={post.id}
              title={post.title}
              date={
                post.date instanceof Date
                  ? post.date.toLocaleDateString()
                  : post.date.toDate
                    ? post.date.toDate().toLocaleDateString()
                    : new Date(post.date).toLocaleDateString()
              }
              author={post.author}
              content={post.content}
              imageUrl={post.imageUrl}
              excerpt={post.excerpt}
              likes={post.likes || 0}
              hashtags={post.hashtags || []}
            />
          ))}
        </div>
      ) : (
        <p>No posts found with #{tag}</p>
      )}
    </div>
  );
}

export default TagsPage;