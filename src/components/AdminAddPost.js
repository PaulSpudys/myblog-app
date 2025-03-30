import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import TextEditorToolbar from './TextEditorToolbar';
import './AdminAddPost.css';

function AdminAddPost() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '', // Added excerpt field
    author: 'him',
  });
  
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({
    start: 0,
    end: 0
  });
  
  // Reference for the textarea element
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Track cursor position and selection in the textarea
  const handleTextareaSelect = (e) => {
    setCursorPosition({
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Update preview for content changes
    if (name === 'content') {
      updatePreview(value);
    }
  };

  const handleAuthorToggle = () => {
    setFormData(prevState => ({
      ...prevState,
      author: prevState.author === 'him' ? 'her' : 'him'
    }));
  };
  
  const handleFormatText = (tag) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const { start, end } = cursorPosition;
    const currentContent = formData.content;
    
    // If no text is selected, place cursor between tags
    if (start === end) {
      let newContent;
      let newCursorPos;
      
      switch (tag) {
        case 'ul':
          // For lists, add a bullet point
          newContent = 
            currentContent.substring(0, start) + 
            '\n• ' + 
            currentContent.substring(end);
          newCursorPos = start + 3; // After the bullet and space
          break;
        
        case 'blockquote':
          // For blockquotes, add the tags and a line break
          newContent = 
            currentContent.substring(0, start) + 
            '<blockquote>\n' + 
            '\n</blockquote>' + 
            currentContent.substring(end);
          newCursorPos = start + 13; // After the opening tag and newline
          break;
        
        case 'h2':
        case 'h3':
          // For headings, add the tags and place cursor between them
          newContent = 
            currentContent.substring(0, start) + 
            `<${tag}>` + 
            `</${tag}>` + 
            currentContent.substring(end);
          newCursorPos = start + tag.length + 2; // After the opening tag
          break;
        
        default:
          // For other tags, just add them and place cursor in between
          newContent = 
            currentContent.substring(0, start) + 
            `<${tag}>` + 
            `</${tag}>` + 
            currentContent.substring(end);
          newCursorPos = start + tag.length + 2; // Position after the opening tag
      }
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      // Set cursor position after rendering
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
      
    } else {
      // If text is selected, wrap it with the tags
      let newContent;
      
      switch (tag) {
        case 'ul':
          // For lists, handle each line
          const selectedText = currentContent.substring(start, end);
          const lines = selectedText.split('\n');
          const bulletedLines = lines.map(line => 
            line.trim() ? `• ${line}` : line
          ).join('\n');
          
          newContent = 
            currentContent.substring(0, start) + 
            bulletedLines + 
            currentContent.substring(end);
          break;
        
        case 'blockquote':
          // For blockquotes, wrap the selected text
          newContent = 
            currentContent.substring(0, start) + 
            `<blockquote>${currentContent.substring(start, end)}</blockquote>` + 
            currentContent.substring(end);
          break;
        
        default:
          // For other tags, just wrap the selected text
          newContent = 
            currentContent.substring(0, start) + 
            `<${tag}>${currentContent.substring(start, end)}</${tag}>` + 
            currentContent.substring(end);
      }
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      // Set cursor position after the formatted text
      const newCursorPos = end + (tag.length * 2) + 5; // Adjusted for the opening and closing tags
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
    }
    
    // Update preview with the new content
    updatePreview(formData.content);
  };
  
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const newImages = [];
    
    for (const file of files) {
      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      
      newImages.push({
        file,
        previewUrl,
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        uploaded: false,
        position: 'center', // Default position
        insertPosition: null // Will be set when the image is inserted into the content
      });
    }
    
    setImages(prevImages => [...prevImages, ...newImages]);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeImage = (id) => {
    const imageToRemove = images.find(img => img.id === id);
    
    if (imageToRemove && imageToRemove.insertPosition !== null) {
      // Remove the image placeholder from the content
      const placeholderText = `[IMAGE:${id}]`;
      const currentContent = formData.content;
      const newContent = currentContent.replace(placeholderText, '');
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      updatePreview(newContent, images.filter(image => image.id !== id));
    }
    
    setImages(prevImages => prevImages.filter(image => image.id !== id));
  };
  
  const changeImagePosition = (id, position) => {
    setImages(prevImages => 
      prevImages.map(image => 
        image.id === id 
          ? { ...image, position } 
          : image
      )
    );
    
    // Update preview
    updatePreview(formData.content);
  };
  
  const selectImageToInsert = (index) => {
    setSelectedImageIndex(index);
  };
  
  const insertSelectedImage = () => {
    if (selectedImageIndex === null || !textareaRef.current) return;
    
    const selectedImage = images[selectedImageIndex];
    const placeholderText = `[IMAGE:${selectedImage.id}]`;
    const currentContent = formData.content;
    const { start } = cursorPosition;
    
    const newContent = 
      currentContent.substring(0, start) + 
      placeholderText + 
      currentContent.substring(start);
    
    // Update the image's insert position
    setImages(prevImages => 
      prevImages.map((image, index) => 
        index === selectedImageIndex
          ? { ...image, insertPosition: start }
          : image
      )
    );
    
    // Update the content with the placeholder
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    
    // Reset selected image
    setSelectedImageIndex(null);
    
    // Update preview
    updatePreview(newContent);
    
    // Focus back on textarea and position cursor after the inserted placeholder
    const newCursorPos = start + placeholderText.length;
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      setCursorPosition({ start: newCursorPos, end: newCursorPos });
    }, 0);
  };
  
  const updatePreview = (content) => {
    // Replace image placeholders with actual image elements
    let htmlContent = content;
    
    // First replace image placeholders with actual HTML
    images.forEach(image => {
      const placeholder = `[IMAGE:${image.id}]`;
      const imgClass = `preview-image preview-${image.position}`;
      const imgHtml = `
        <div class="${imgClass}">
          <img src="${image.previewUrl}" alt="Image" />
        </div>
      `;
      
      htmlContent = htmlContent.replace(placeholder, imgHtml);
    });
    
    // Then convert line breaks to HTML breaks
    htmlContent = htmlContent.replace(/\n/g, '<br>');
    
    setPreviewContent(htmlContent);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitStatus('');

    try {
      // Upload all images to Firebase Storage with cleaned filenames
      const uploadedImages = [];
      
      for (let image of images) {
        // Clean filename to avoid URL encoding issues
        const cleanFileName = image.file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storageRef = ref(storage, `blog-images/${Date.now()}_${cleanFileName}`);
        await uploadBytes(storageRef, image.file);
        const downloadUrl = await getDownloadURL(storageRef);
        
        uploadedImages.push({
          url: downloadUrl,
          position: image.position,
          id: image.id
        });
      }
      
      console.log('Uploading images:', uploadedImages);
      
      // Replace image placeholders in the content with actual HTML image tags
      let finalContent = formData.content;
      
      // Process each image placeholder one by one to avoid conflicts
      for (const image of uploadedImages) {
        const placeholder = `[IMAGE:${image.id}]`;
        const imgHtml = `<img src="${image.url}" class="blog-image-${image.position}" alt="Blog Image" />`;
        
        // Replace all occurrences of this placeholder
        while (finalContent.includes(placeholder)) {
          finalContent = finalContent.replace(placeholder, imgHtml);
        }
      }
      
      // Handle line breaks properly for HTML display
      finalContent = finalContent.replace(/\n/g, '<br>');
      
      console.log('Final content with images:', finalContent);
      
      // Get the first image URL to use as the main post image
      const mainImageUrl = uploadedImages.length > 0 ? uploadedImages[0].url : null;

      // Generate an excerpt if not provided
      const generatedExcerpt = finalContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...';

      // Add blog post to Firestore
      await addDoc(collection(db, "blogPosts"), {
        title: formData.title,
        content: finalContent,
        excerpt: formData.excerpt || generatedExcerpt, // Use provided excerpt or generate one
        author: formData.author,
        date: Timestamp.now(),
        imageUrl: mainImageUrl, // Set the first image as the main image
        images: uploadedImages // Store all images
      });

      setSubmitMessage('Blog post published successfully!');
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        author: formData.author
      });
      setImages([]);
      setPreviewContent('');
      
    } catch (error) {
      console.error("Error publishing blog post: ", error);
      setSubmitMessage('Failed to publish blog post. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update preview whenever content or images change
  useEffect(() => {
    updatePreview(formData.content);
  }, [formData.content, images]);

  return (
    <div className="admin-post-container">
      <h2 className="admin-title">Add New Blog Post</h2>
      <div className="admin-layout">
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
            <label htmlFor="excerpt">Excerpt (Short Description)</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="3"
              placeholder="A brief description of your post (displayed in the blog listings)"
            ></textarea>
            <div className="content-help">
              This short description will appear in blog listing pages. If left empty, it will be automatically generated.
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <TextEditorToolbar onFormatText={handleFormatText} />
            <textarea
              id="content"
              name="content"
              ref={textareaRef}
              value={formData.content}
              onChange={handleChange}
              onSelect={handleTextareaSelect}
              onClick={handleTextareaSelect}
              onKeyUp={handleTextareaSelect}
              rows="10"
              required
            ></textarea>
            <div className="content-help">
              Use the formatting toolbar to style your text. Select text first to apply formatting, or place your cursor where you want to insert formatted elements.
            </div>
          </div>
          
          <div className="form-group">
            <label>Add Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              ref={fileInputRef}
            />
          </div>
          
          {images.length > 0 && (
            <div className="image-gallery">
              <h3>Available Images</h3>
              <div className="image-list">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className={`image-item ${selectedImageIndex === index ? 'selected' : ''}`}
                    onClick={() => selectImageToInsert(index)}
                  >
                    <img 
                      src={image.previewUrl} 
                      alt="Preview" 
                      className="image-preview" 
                    />
                    <div className="image-controls">
                      <select 
                        value={image.position}
                        onChange={(e) => changeImagePosition(image.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                        <option value="full">Full Width</option>
                      </select>
                      <div className="image-buttons">
                        <button 
                          type="button" 
                          className="insert-image"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectImageToInsert(index);
                            insertSelectedImage();
                          }}
                        >
                          Insert
                        </button>
                        <button 
                          type="button" 
                          className="remove-image"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {image.insertPosition !== null && (
                      <div className="image-status">Inserted in content</div>
                    )}
                  </div>
                ))}
              </div>
              
              {selectedImageIndex !== null && (
                <div className="insert-controls">
                  <button 
                    type="button" 
                    className="insert-button"
                    onClick={insertSelectedImage}
                  >
                    Insert Selected Image at Cursor Position
                  </button>
                </div>
              )}
            </div>
          )}
          
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
        
        <div className="post-preview">
          <h3>Post Preview</h3>
          <div className="preview-title">
            {formData.title || 'Your Title Here'}
          </div>
          <div className="preview-author">
            By {formData.author === 'him' ? 'Him' : 'Her'}
          </div>
          <div 
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: previewContent || 'Your content will appear here...' }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default AdminAddPost;