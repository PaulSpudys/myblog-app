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
  const [thumbnailId, setThumbnailId] = useState(null); // Track selected thumbnail
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

  const handleHashtagsChange = (e) => {
    const value = e.target.value;
    setFormData(prevState => ({
      ...prevState,
      hashtags: value
    }));
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
        insertPosition: null,
        size: 'medium',
        pairedWith: null
      });
    }
    
    setImages(prevImages => [...prevImages, ...newImages]);
    
    // Set first uploaded image as thumbnail if none selected
    if (!thumbnailId && newImages.length > 0) {
      setThumbnailId(newImages[0].id);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeImage = (id) => {
    const imageToRemove = images.find(img => img.id === id);
    
    if (imageToRemove && imageToRemove.insertPosition !== null) {
      const placeholderText = imageToRemove.pairedWith
        ? `[PAIRED:${imageToRemove.id}:${imageToRemove.pairedWith}]`
        : `[IMAGE:${id}]`;
      const currentContent = formData.content;
      const newContent = currentContent.replace(placeholderText, '');
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      updatePreview(newContent, images.filter(image => image.id !== id));
    }
    
    setImages(prevImages => prevImages.filter(image => image.id !== id));
    
    // Reset thumbnail if removed image was the thumbnail
    if (thumbnailId === id) {
      setThumbnailId(images.length > 1 ? images[0].id : null);
    }
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

  const changeImageSize = (id, size) => {
    setImages(prevImages =>
      prevImages.map(image =>
        image.id === id ? { ...image, size } : image
      )
    );
    updatePreview(formData.content);
  };

  const handleImagePairing = (id, pairedId) => {
    setImages(prevImages => {
      const updatedImages = prevImages.map(img => ({
        ...img,
        pairedWith: img.pairedWith === id || img.pairedWith === pairedId ? null : img.pairedWith
      }));
      return updatedImages.map(img =>
        img.id === id ? { ...img, pairedWith: pairedId || null } :
        img.id === pairedId ? { ...img, pairedWith: id } : img
      );
    });
    updatePreview(formData.content);
  };
  
  const selectImageToInsert = (index) => {
    setSelectedImageIndex(index);
  };
  
  const insertSelectedImage = () => {
    if (selectedImageIndex === null || !textareaRef.current) return;
    
    const selectedImage = images[selectedImageIndex];
    let placeholderText = `[IMAGE:${selectedImage.id}]`;
    
    if (selectedImage.pairedWith) {
      placeholderText = `[PAIRED:${selectedImage.id}:${selectedImage.pairedWith}]`;
    }
    
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
          : image.id === selectedImage.pairedWith
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

  const moveImageUp = (id) => {
    const image = images.find(img => img.id === id);
    if (!image.insertPosition) return;
    
    const content = formData.content;
    const placeholder = image.pairedWith 
      ? `[PAIRED:${image.id}:${image.pairedWith}]` 
      : `[IMAGE:${image.id}]`;
    
    const placeholders = [];
    images.forEach(img => {
      if (img.insertPosition !== null) {
        if (img.pairedWith) {
          placeholders.push({
            text: `[PAIRED:${img.id}:${img.pairedWith}]`,
            position: img.insertPosition
          });
        } else {
          placeholders.push({
            text: `[IMAGE:${img.id}]`,
            position: img.insertPosition
          });
        }
      }
    });
    
    placeholders.sort((a, b) => a.position - b.position);
    const currentIndex = placeholders.findIndex(p => p.text === placeholder);
    if (currentIndex <= 0) return;
    
    const prevPlaceholder = placeholders[currentIndex - 1];
    
    let newContent = content;
    const tempPlaceholder = '@@@TEMP@@@';
    newContent = newContent.replace(placeholder, tempPlaceholder);
    newContent = newContent.replace(prevPlaceholder.text, placeholder);
    newContent = newContent.replace(tempPlaceholder, prevPlaceholder.text);
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    
    setImages(prevImages =>
      prevImages.map(img => {
        if (img.id === id) {
          return { ...img, insertPosition: prevPlaceholder.position };
        }
        if (img.id === prevPlaceholder.text.match(/IMAGE:(\w+)/)?.[1] ||
            img.id === prevPlaceholder.text.match(/PAIRED:(\w+):/)?.[1]) {
          return { ...img, insertPosition: image.insertPosition };
        }
        return img;
      })
    );
    
    updatePreview(newContent);
  };

  const moveImageDown = (id) => {
    const image = images.find(img => img.id === id);
    if (!image.insertPosition) return;
    
    const content = formData.content;
    const placeholder = image.pairedWith 
      ? `[PAIRED:${image.id}:${image.pairedWith}]` 
      : `[IMAGE:${image.id}]`;
    
    const placeholders = [];
    images.forEach(img => {
      if (img.insertPosition !== null) {
        if (img.pairedWith) {
          placeholders.push({
            text: `[PAIRED:${img.id}:${img.pairedWith}]`,
            position: img.insertPosition
          });
        } else {
          placeholders.push({
            text: `[IMAGE:${img.id}]`,
            position: img.insertPosition
          });
        }
      }
    });
    
    placeholders.sort((a, b) => a.position - b.position);
    const currentIndex = placeholders.findIndex(p => p.text === placeholder);
    if (currentIndex >= placeholders.length - 1) return;
    
    const nextPlaceholder = placeholders[currentIndex + 1];
    
    let newContent = content;
    const tempPlaceholder = '@@@TEMP@@@';
    newContent = newContent.replace(placeholder, tempPlaceholder);
    newContent = newContent.replace(nextPlaceholder.text, placeholder);
    newContent = newContent.replace(tempPlaceholder, nextPlaceholder.text);
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    
    setImages(prevImages =>
      prevImages.map(img => {
        if (img.id === id) {
          return { ...img, insertPosition: nextPlaceholder.position };
        }
        if (img.id === nextPlaceholder.text.match(/IMAGE:(\w+)/)?.[1] ||
            img.id === nextPlaceholder.text.match(/PAIRED:(\w+):/)?.[1]) {
          return { ...img, insertPosition: image.insertPosition };
        }
        return img;
      })
    );
    
    updatePreview(newContent);
  };
  
  const updatePreview = (content, imagesList = images) => {
    let htmlContent = content;
    
    imagesList.forEach(image => {
      const singlePlaceholder = `[IMAGE:${image.id}]`;
      if (htmlContent.includes(singlePlaceholder)) {
        const imgClass = `preview-image preview-${image.position} size-${image.size}`;
        const imgHtml = `
          <div class="${imgClass}">
            <img src="${image.previewUrl}" alt="Image" />
          </div>
        `;
        htmlContent = htmlContent.replace(singlePlaceholder, imgHtml);
      }
      
      imagesList.forEach(otherImage => {
        if (image.id < otherImage.id) {
          const pairedPlaceholder = `[PAIRED:${image.id}:${otherImage.id}]`;
          const reversePairedPlaceholder = `[PAIRED:${otherImage.id}:${image.id}]`;
          if (htmlContent.includes(pairedPlaceholder) || htmlContent.includes(reversePairedPlaceholder)) {
            const pairHtml = `
              <div class="preview-image-pair">
                <div class="preview-image size-${image.size}">
                  <img src="${image.previewUrl}" alt="Image" />
                </div>
                <div class="preview-image size-${otherImage.size}">
                  <img src="${otherImage.previewUrl}" alt="Image" />
                </div>
              </div>
            `;
            htmlContent = htmlContent.replace(pairedPlaceholder, pairHtml);
            htmlContent = htmlContent.replace(reversePairedPlaceholder, pairHtml);
          }
        }
      });
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
        let downloadUrl = image.previewUrl;
        if (!image.uploaded) {
          const cleanFileName = image.file.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const storageRef = ref(storage, `blog-images/${Date.now()}_${cleanFileName}`);
          await uploadBytes(storageRef, image.file);
          downloadUrl = await getDownloadURL(storageRef);
        }
        
        uploadedImages.push({
          url: downloadUrl,
          position: image.position,
          size: image.size,
          id: image.id,
          pairedWith: image.pairedWith
        });
      }
      
      let finalContent = formData.content;
      
      for (const image of uploadedImages) {
        const singlePlaceholder = `[IMAGE:${image.id}]`;
        if (finalContent.includes(singlePlaceholder)) {
          const imgHtml = `<img src="${image.url}" class="blog-image-${image.position} size-${image.size}" alt="Blog Image" />`;
          finalContent = finalContent.replace(singlePlaceholder, imgHtml);
        }
        
        if (image.pairedWith) {
          const pairedImage = uploadedImages.find(img => img.id === image.pairedWith);
          if (pairedImage) {
            const pairedPlaceholder = `[PAIRED:${image.id}:${pairedImage.id}]`;
            const reversePairedPlaceholder = `[PAIRED:${pairedImage.id}:${image.id}]`;
            const pairHtml = `
              <div class="blog-image-pair">
                <img src="${image.url}" class="size-${image.size}" alt="Blog Image" />
                <img src="${pairedImage.url}" class="size-${pairedImage.size}" alt="Blog Image" />
              </div>
            `;
            finalContent = finalContent.replace(pairedPlaceholder, pairHtml);
            finalContent = finalContent.replace(reversePairedPlaceholder, pairHtml);
          }
        }
      }
      
      finalContent = finalContent.replace(/\n/g, '<br>');
      
      // Use selected thumbnail or first image if none selected
      const mainImageUrl = thumbnailId 
        ? uploadedImages.find(img => img.id === thumbnailId)?.url 
        : uploadedImages.length > 0 
          ? uploadedImages[0].url 
          : null;

      const hashtagsArray = formData.hashtags
        .split(',')
        .map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ''))
        .filter(tag => tag.length > 0);

      await addDoc(collection(db, "blogPosts"), {
        title: formData.title,
        content: finalContent,
        excerpt: formData.excerpt || finalContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
        author: formData.author,
        date: Timestamp.now(),
        imageUrl: mainImageUrl, // Explicitly set thumbnail
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
      setThumbnailId(null); // Reset thumbnail
      setPreviewContent('');
      
    } catch (error) {
      console.error("Error publishing blog post: ", error);
      setSubmitMessage('Failed to publish blog post. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbnailSelect = (id) => {
    setThumbnailId(id);
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
            <label htmlFor="hashtags">Hashtags (comma-separated, e.g., travel, fishing, biking)</label>
            <input
              type="text"
              id="hashtags"
              name="hashtags"
              value={formData.hashtags}
              onChange={handleHashtagsChange}
              placeholder="travel, fishing, biking"
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
                      <div className="thumbnail-select">
                        <label>
                          <input
                            type="radio"
                            name="thumbnail"
                            checked={thumbnailId === image.id}
                            onChange={() => handleThumbnailSelect(image.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          Set as Thumbnail
                        </label>
                      </div>
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
                      <select
                        value={image.size}
                        onChange={(e) => changeImageSize(image.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                      <select
                        value={image.pairedWith || ''}
                        onChange={(e) => handleImagePairing(image.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">No Pair</option>
                        {images
                          .filter(img => img.id !== image.id && img.pairedWith === null)
                          .map(img => (
                            <option key={img.id} value={img.id}>{`Image ${images.findIndex(i => i.id === img.id) + 1}`}</option>
                          ))
                        }
                      </select>
                      <div className="image-buttons">
                        <button 
                          type="button" 
                          className="move-image-up"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImageUp(image.id);
                          }}
                          disabled={image.insertPosition === null}
                        >
                          ↑
                        </button>
                        <button 
                          type="button" 
                          className="move-image-down"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImageDown(image.id);
                          }}
                          disabled={image.insertPosition === null}
                        >
                          ↓
                        </button>
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
                    {thumbnailId === image.id && (
                      <div className="thumbnail-status">Selected as Thumbnail</div>
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