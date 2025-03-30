import React from 'react';
import './TextEditorToolbar.css';

function TextEditorToolbar({ onFormatText }) {
  const formatOptions = [
    { name: 'Bold', action: 'bold', icon: '𝐁', tag: 'strong' },
    { name: 'Italic', action: 'italic', icon: '𝐼', tag: 'em' },
    { name: 'Underline', action: 'underline', icon: '𝐔', tag: 'u' },
    { name: 'Heading 2', action: 'h2', icon: 'H2', tag: 'h2' },
    { name: 'Heading 3', action: 'h3', icon: 'H3', tag: 'h3' },
    { name: 'Quote', action: 'quote', icon: '"', tag: 'blockquote' },
    { name: 'List', action: 'list', icon: '•', tag: 'ul' }
  ];

  return (
    <div className="text-editor-toolbar">
      {formatOptions.map((option) => (
        <button
          key={option.action}
          type="button"
          className="toolbar-button"
          title={option.name}
          onClick={() => onFormatText(option.tag)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

export default TextEditorToolbar;