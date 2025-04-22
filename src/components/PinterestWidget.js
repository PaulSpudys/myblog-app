import React, { useEffect, useRef } from 'react';
import './PinterestWidget.css';

function PinterestWidget() {
  const widgetRef = useRef(null);
  const scriptRef = useRef(null);

  useEffect(() => {
    // Load the Pinterest script
    let script = document.querySelector('script[src="https://assets.pinterest.com/js/pinit.js"]');
    if (!script) {
      script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = 'https://assets.pinterest.com/js/pinit.js';
      document.body.appendChild(script);
    }
    scriptRef.current = script;

    // Check if the widget loaded after 5 seconds
    const timer = setTimeout(() => {
      const widget = widgetRef.current.querySelector('[data-pin-do="embedUser"]');
      const hasLoaded = widget && widget.innerHTML.trim().length > 0;
      if (!hasLoaded) {
        widgetRef.current.querySelector('#pinterest-fallback').style.display = 'block';
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      const currentScript = scriptRef.current;
      if (currentScript && document.body.contains(currentScript)) {
        document.body.removeChild(currentScript);
      }
    };
  }, []);

  return (
    <div ref={widgetRef} style={{ textAlign: 'center' }}>
      <h3>My Pinterest</h3>
      <a
        data-pin-do="embedUser"
        data-pin-board-width="210"
        data-pin-scale-height="400"
        data-pin-scale-width="100"
        href="https://www.pinterest.com/missdailyoverthinker/"
      ></a>
      <div
        id="pinterest-fallback"
        style={{
          display: 'none',
          marginTop: '10px',
          fontFamily: "'Trebuchet MS', Trebuchet, Verdana, sans-serif",
          fontSize: '12px',
          color: '#666666',
        }}
      >
        
      </div>
    </div>
  );
}

export default PinterestWidget;