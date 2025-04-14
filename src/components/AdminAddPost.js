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
    excerpt: '',
    author: 'him',
    hashtags: ''
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
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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
  
  const handleFormatText = (tag, value) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const { start, end } = cursorPosition;
    const currentContent = formData.content;
    
    if (tag === 'fontFamily' || tag === 'fontSize' || tag === 'color') {
      if (start === end) {
        alert("Please select some text before applying " + 
          (tag === 'fontFamily' ? 'font family' : 
           tag === 'fontSize' ? 'font size' : 'color'));
        return;
      } else {
        const styleAttr = tag === 'fontFamily' ? 'font-family' : tag === 'fontSize' ? 'font-size' : 'color';
        const newContent = 
          currentContent.substring(0, start) + 
          `<span style="${styleAttr}: ${value}">` + 
          currentContent.substring(start, end) + 
          `</span>` + 
          currentContent.substring(end);
        
        setFormData(prev => ({
          ...prev,
          content: newContent
        }));
        
        const newCursorPos = end + `<span style="${styleAttr}: ${value}">`.length + 7;
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPosition({ start: newCursorPos, end: newCursorPos });
        }, 0);
        
        updatePreview(newContent);
        return;
      }
    }
    
    if (start === end) {
      let newContent;
      let newCursorPos;
      
      switch (tag) {
        case 'ul':
          newContent = 
            currentContent.substring(0, start) + 
            '\n• ' + 
            currentContent.substring(end);
          newCursorPos = start + 3;
          break;
        
        case 'blockquote':
          newContent = 
            currentContent.substring(0, start) + 
            '<blockquote>\n' + 
            '\n</blockquote>' + 
            currentContent.substring(end);
          newCursorPos = start + 13;
          break;
        
        case 'h2':
        case 'h3':
          newContent = 
            currentContent.substring(0, start) + 
            `<${tag}>` + 
            `</${tag}>` + 
            currentContent.substring(end);
          newCursorPos = start + tag.length + 2;
          break;
        
        default:
          newContent = 
            currentContent.substring(0, start) + 
            `<${tag}>` + 
            `</${tag}>` + 
            currentContent.substring(end);
          newCursorPos = start + tag.length + 2;
      }
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
      
    } else {
      let newContent;
      
      switch (tag) {
        case 'ul':
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
          newContent = 
            currentContent.substring(0, start) + 
            `<blockquote>${currentContent.substring(start, end)}</blockquote>` + 
            currentContent.substring(end);
          break;
        
        default:
          newContent = 
            currentContent.substring(0, start) + 
            `<${tag}>${currentContent.substring(start, end)}</${tag}>` + 
            currentContent.substring(end);
      }
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      const newCursorPos = end + (tag.length * 2) + 5;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
    }
    
    updatePreview(formData.content);
  };
  
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const newImages = [];
    
    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      
      newImages.push({
        file,
        previewUrl,
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        uploaded: false,
        position: 'center',
        insertPosition: null
      });
    }
    
    setImages(prevImages => [...prevImages, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeImage = (id) => {
    const imageToRemove = images.find(img => img.id === id);
    
    if (imageToRemove && imageToRemove.insertPosition !== null) {
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
    
    setImages(prevImages => 
      prevImages.map((image, index) => 
        index === selectedImageIndex
          ? { ...image, insertPosition: start }
          : image
      )
    );
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    
    setSelectedImageIndex(null);
    
    updatePreview(newContent);
    
    const newCursorPos = start + placeholderText.length;
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      setCursorPosition({ start: newCursorPos, end: newCursorPos });
    }, 0);
  };
  
  const updatePreview = (content) => {
    let htmlContent = content;
    
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
    
    htmlContent = htmlContent.replace(/\n/g, '<br>');
    
    setPreviewContent(htmlContent);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitStatus('');

    try {
      const uploadedImages = [];
      
      for (let image of images) {
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
      
      let finalContent = formData.content;
      
      for (const image of uploadedImages) {
        const placeholder = `[IMAGE:${image.id}]`;
        const imgHtml = `<img src="${image.url}" class="blog-image-${image.position}" alt="Blog Image" />`;
        
        while (finalContent.includes(placeholder)) {
          finalContent = finalContent.replace(placeholder, imgHtml);
        }
      }
      
      finalContent = finalContent.replace(/\n/g, '<br>');
      
      const mainImageUrl = uploadedImages.length > 0 ? uploadedImages[0].url : null;

      const generatedExcerpt = finalContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...';

      // Process hashtags
      const hashtagsArray = formData.hashtags
        .split(',')
        .map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
        .filter(tag => tag !== '');

      await addDoc(collection(db, "blogPosts"), {
        title: formData.title,
        content: finalContent,
        excerpt: formData.excerpt || generatedExcerpt,
        author: formData.author,
        date: Timestamp.now(),
        imageUrl: mainImageUrl,
        images: uploadedImages,
        hashtags: hashtagsArray
      });

      setSubmitMessage('Blog post published successfully!');
      setSubmitStatus('success');
      
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        author: formData.author,
        hashtags: ''
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
            <label htmlFor="hashtags">Hashtags (comma-separated, e.g., travel-tips, adventure)</label>
            <input
              type="text"
              id="hashtags"
              name="hashtags"
              value={formData.hashtags}
              onChange={handleChange}
              placeholder="travel-tips, adventure, europe"
            />
            <div className="content-help">
              Add hashtags to improve searchability (3-5 recommended).
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