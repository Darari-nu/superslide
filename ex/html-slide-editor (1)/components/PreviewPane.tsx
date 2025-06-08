
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface PreviewPaneProps {
  htmlContent: string;
}

const PreviewPane = forwardRef<HTMLIFrameElement, PreviewPaneProps>(({ htmlContent }, ref) => {
  const localIframeRef = useRef<HTMLIFrameElement>(null);
  useImperativeHandle(ref, () => localIframeRef.current as HTMLIFrameElement);
  
  const iframeScript = `
    <script>
      document.body.addEventListener('click', function(event) {
        let target = event.target;
        let chosenElement = null;
        const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'ARTICLE', 'SECTION', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'TABLE', 'UL', 'OL', 'IMG', 'BUTTON', 'A'];
        
        let current = target;
        for (let i = 0; i < 7 && current && current !== document.body; i++) { // Limit upward traversal
          const currentTagName = current.tagName.toUpperCase();
          if (blockTags.includes(currentTagName)) {
            chosenElement = current;
            break;
          }
          if (currentTagName === 'DIV' && (current.parentElement === document.body || current.classList.length > 0 || Object.keys(current.dataset).length > 0)) {
              // Prioritize DIVs that are direct children of body or have classes/data-attributes
              chosenElement = current;
              break;
          }
          if (!current.parentElement) break; // Stop if no parent
          current = current.parentElement;
        }

        if (!chosenElement && target && target !== document.body) {
          chosenElement = target; // Fallback to the direct target
        }
        
        if (chosenElement && chosenElement !== document.body) {
          window.parent.postMessage({
            type: 'previewElementClicked',
            outerHTML: chosenElement.outerHTML,
          }, '*');
        }
      }, true);
    </script>
  `;

  const srcDocContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { margin: 0; height: 100vh; width: 100vw; overflow: auto; background-color: #f0f0f0; /* Default background for slide area */ }
        /* Ensure user content takes full height if it's a single root div */
        body > div:first-child:last-child { height: 100%; }
        /* Basic clickable cursor for elements that might be targeted */
        h1, h2, h3, h4, h5, h6, p, li, div, span, img, a, button { cursor: pointer; }
      </style>
    </head>
    <body>
      ${htmlContent}
      ${iframeScript}
    </body>
    </html>
  `;

  useEffect(() => {
    const iframe = localIframeRef.current;
    if (iframe) {
      iframe.srcdoc = srcDocContent;
    }
  }, [htmlContent, srcDocContent]); // srcDocContent depends on htmlContent and iframeScript

  return (
    <iframe
      ref={localIframeRef}
      title="Slide Preview"
      className="w-full h-full border-none bg-gray-200"
      sandbox="allow-scripts allow-same-origin" // allow-same-origin is needed for postMessage to parent from srcdoc in some cases
    />
  );
});

PreviewPane.displayName = 'PreviewPane';
export { PreviewPane };
