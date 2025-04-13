import React, { useState } from 'react';
import './TextEditorToolbar.css';

function TextEditorToolbar({ onFormatText }) {
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const formatOptions = [
    { name: 'Bold', action: 'bold', icon: '𝐁', tag: 'strong' },
    { name: 'Italic', action: 'italic', icon: '𝐼', tag: 'em' },
    { name: 'Underline', action: 'underline', icon: '𝐔', tag: 'u' },
    { name: 'Heading 2', action: 'h2', icon: 'H2', tag: 'h2' },
    { name: 'Heading 3', action: 'h3', icon: 'H3', tag: 'h3' },
    { name: 'Quote', action: 'quote', icon: '"', tag: 'blockquote' },
    { name: 'List', action: 'list', icon: '•', tag: 'ul' }
  ];

  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { name: 'Garamond', value: 'Garamond, serif' },
    { name: 'Palatino', value: 'Palatino, serif' },
    { name: 'Lucida Sans', value: 'Lucida Sans, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' }
  ];

  const fontSizes = [
    { name: '8pt', value: '8pt' },
    { name: '9pt', value: '9pt' },
    { name: '10pt', value: '10pt' },
    { name: '11pt', value: '11pt' },
    { name: '12pt', value: '12pt' },
    { name: '14pt', value: '14pt' },
    { name: '16pt', value: '16pt' },
    { name: '18pt', value: '18pt' },
    { name: '20pt', value: '20pt' },
    { name: '22pt', value: '22pt' },
    { name: '24pt', value: '24pt' },
    { name: '26pt', value: '26pt' },
    { name: '28pt', value: '28pt' },
    { name: '36pt', value: '36pt' },
    { name: '48pt', value: '48pt' },
    { name: '72pt', value: '72pt' }
  ];

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Green', value: '#008000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'Purple', value: '#800080' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Brown', value: '#A52A2A' },
    { name: 'Pink', value: '#FFC0CB' },
    { name: 'Lime', value: '#00FF00' },
    { name: 'Cyan', value: '#00FFFF' },
    { name: 'Magenta', value: '#FF00FF' },
    { name: 'Gray', value: '#808080' },
    { name: 'Dark Gray', value: '#404040' },
    { name: 'Light Gray', value: '#C0C0C0' },
    { name: 'Navy', value: '#000080' },
    { name: 'Teal', value: '#008080' },
    { name: 'Olive', value: '#808000' },
    { name: 'Maroon', value: '#800000' }
  ];

  const handleFontFamilySelect = (fontFamily) => {
    onFormatText('fontFamily', fontFamily);
    setShowFontFamilyDropdown(false);
  };

  const handleFontSizeSelect = (fontSize) => {
    onFormatText('fontSize', fontSize);
    setShowFontSizeDropdown(false);
  };

  const handleColorSelect = (color) => {
    onFormatText('color', color);
    setShowColorPicker(false);
  };

  // Close dropdowns when clicking elsewhere
  const closeDropdowns = () => {
    setShowFontFamilyDropdown(false);
    setShowFontSizeDropdown(false);
    setShowColorPicker(false);
  };

  return (
    <div className="text-editor-toolbar" onClick={closeDropdowns}>
      {/* Font Family Dropdown */}
      <div className="dropdown-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="toolbar-button font-button"
          title="Font Family"
          onClick={() => {
            setShowFontFamilyDropdown(!showFontFamilyDropdown);
            setShowFontSizeDropdown(false);
            setShowColorPicker(false);
          }}
        >
          <span className="button-icon">Font</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        {showFontFamilyDropdown && (
          <div className="dropdown-menu font-menu">
            {fontFamilies.map((font) => (
              <button
                key={font.name}
                className="dropdown-item"
                style={{ fontFamily: font.value }}
                onClick={() => handleFontFamilySelect(font.value)}
              >
                {font.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size Dropdown */}
      <div className="dropdown-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="toolbar-button font-size-button"
          title="Font Size"
          onClick={() => {
            setShowFontSizeDropdown(!showFontSizeDropdown);
            setShowFontFamilyDropdown(false);
            setShowColorPicker(false);
          }}
        >
          <span className="button-icon">Size</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        {showFontSizeDropdown && (
          <div className="dropdown-menu size-menu">
            {fontSizes.map((size) => (
              <button
                key={size.name}
                className="dropdown-item"
                onClick={() => handleFontSizeSelect(size.value)}
              >
                {size.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Picker */}
      <div className="dropdown-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="toolbar-button color-button"
          title="Text Color"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowFontFamilyDropdown(false);
            setShowFontSizeDropdown(false);
          }}
        >
          <span className="color-icon">Color</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        {showColorPicker && (
          <div className="dropdown-menu color-grid">
            {colors.map((color) => (
              <button
                key={color.name}
                className="color-option"
                title={color.name}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.value)}
              ></button>
            ))}
          </div>
        )}
      </div>

      {/* Original Format Options */}
      {formatOptions.map((option) => (
        <button
          key={option.action}
          type="button"
          className="toolbar-button"
          title={option.name}
          onClick={(e) => {
            e.stopPropagation();
            onFormatText(option.tag);
          }}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

export default TextEditorToolbar;