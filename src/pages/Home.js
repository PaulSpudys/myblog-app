import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
// Import your background images
import hisBackgroundImage from '../assets/images/his.png'; // Create this path based on your project structure
import herBackgroundImage from '../assets/images/her-background.jpg'; // Create this path based on your project structure

function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Our Blog</h1>
          <p className="hero-subtitle">
            A place where we share our thoughts, experiences, and stories.
          </p>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section className="featured-section">
        <div className="featured-grid">
          {/* His Blog with custom background image */}
          <div 
            className="featured-item his-blog"
            style={{ backgroundImage: `linear-gradient(135deg, rgba(110, 142, 250, 0.7), rgba(75, 108, 183, 0.7)), url(${hisBackgroundImage})` }}
          >
            <div className="featured-content">
              <h3>His Blog</h3>
              <p>Explore topics related to technology, sports, and personal development.</p>
              <Link to="/his-blog" className="learn-more">Read More</Link>
            </div>
          </div>
          
          {/* Her Blog with custom background image */}
          <div 
            className="featured-item her-blog"
            style={{ backgroundImage: `linear-gradient(135deg, rgba(216, 88, 147, 0.7), rgba(208, 90, 145, 0.7)), url(${herBackgroundImage})` }}
          >
            <div className="featured-content">
              <h3>Her Blog</h3>
              <p>Discover content about lifestyle, travel, and creative pursuits.</p>
              <Link to="/her-blog" className="learn-more">Read More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="section-header">
          <h2 className="section-title">About Us</h2>
        </div>
        <div className="about-content">
          <p>
            We created this blog as a way to share our individual perspectives and interests. 
            Whether you're here for technology insights, lifestyle tips, or just some interesting stories, 
            we hope you find something that resonates with you.
          </p>
          <Link to="/contact" className="contact-button">Get in Touch</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;