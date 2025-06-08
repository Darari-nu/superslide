import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface PreviewPaneProps {
  htmlContent: string;
  scale: number; // Added for manual zoom control
}

export const PreviewPane = forwardRef<HTMLIFrameElement, PreviewPaneProps>(
  ({ htmlContent, scale }, ref) => {
    const localIframeRef = useRef<HTMLIFrameElement>(null);
    // Expose the localIframeRef to the parent component via the passed `ref`
    useImperativeHandle(ref, () => localIframeRef.current as HTMLIFrameElement);

    // Script for postMessage (from ex sample, can be refined later)
    const iframeScript = `
      <script>
        // Basic click listener for now, can be expanded
        document.body.addEventListener('click', function(event) {
          let target = event.target;
          // Example: Send back the tagName of the clicked element
          if (target && target !== document.body) {
            window.parent.postMessage({
              type: 'previewElementClicked',
              tagName: target.tagName,
              outerHTML: target.outerHTML, // Sending outerHTML for potential highlighting
            }, '*');
          }
        }, true);
      </script>
    `;

    const srcDocContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script> 
        <style>
          body {
            margin: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden; /* Body itself should not scroll */
            background-color: #2d3748; /* Darker background for the iframe body */
            /* display: flex; align-items: center; justify-content: center; Removed for margin-based centering */
          }
          #slide-content-wrapper {
            transform-origin: top left; /* Crucial for correct scaling position before centering */
            background-color: #ffffff; /* Fallback background for the wrapper */
            /* width and height will be set by JS to slide's native dimensions */
            /* transform, marginLeft, marginTop will be set by JS */
          }
        </style>
      </head>
      <body>
        <div id="slide-content-wrapper">
          ${htmlContent}
        </div>
        <script>
          const manualZoomFactor = ${scale || 1.0}; // Use prop scale, default to 1.0

          function applyScaling() {
            const wrapper = document.getElementById('slide-content-wrapper');
            const body = document.body;
            if (!wrapper || !body) return;

            let slideNativeWidth = 1280; // Default native width
            let slideNativeHeight = 720; // Default native height
            
            const slideContainer = wrapper.querySelector('.slide-container');
            if (slideContainer) {
              const computedStyle = window.getComputedStyle(slideContainer);
              let w = parseFloat(computedStyle.width);
              let h = parseFloat(computedStyle.height);
              let minH = parseFloat(computedStyle.minHeight);

              if (!isNaN(w) && w > 0) slideNativeWidth = w;
              if (!isNaN(h) && h > 0) slideNativeHeight = h;
              else if (!isNaN(minH) && minH > 0) slideNativeHeight = minH;
            }

            wrapper.style.width = slideNativeWidth + 'px';
            wrapper.style.height = slideNativeHeight + 'px';

            const viewportWidth = body.clientWidth;
            const viewportHeight = body.clientHeight;

            const scaleX = viewportWidth / slideNativeWidth;
            const scaleY = viewportHeight / slideNativeHeight;
            const autoFitScale = Math.min(scaleX, scaleY) * 0.98; // Apply 2% padding
            const finalScale = autoFitScale * manualZoomFactor;

            wrapper.style.transform = 'scale(' + finalScale + ')';
            
            // Calculate margins to center the scaled wrapper
            const scaledWidth = slideNativeWidth * finalScale;
            const scaledHeight = slideNativeHeight * finalScale;
            wrapper.style.marginLeft = (viewportWidth - scaledWidth) / 2 + 'px';
            wrapper.style.marginTop = (viewportHeight - scaledHeight) / 2 + 'px';
          }

          function debounce(func, wait) {
            let timeout;
            return function(...args) {
              const context = this;
              clearTimeout(timeout);
              timeout = setTimeout(() => func.apply(context, args), wait);
            };
          }

          const debouncedApplyScaling = debounce(applyScaling, 150);

          window.addEventListener('load', () => {
            applyScaling();
            setTimeout(applyScaling, 100); // For safety, re-apply after a short delay
            setTimeout(applyScaling, 500); // And another one for very slow renders
          });
          window.addEventListener('resize', debouncedApplyScaling);

          const contentWrapperForObserver = document.getElementById('slide-content-wrapper');
          if (contentWrapperForObserver) {
            const observer = new MutationObserver((mutationsList) => {
              for (const mutation of mutationsList) {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && mutation.target.classList && mutation.target.classList.contains('slide-container')) ||
                    (mutation.type === 'attributes' && mutation.target.id === 'slide-content-wrapper')) { // Also observe wrapper itself for direct style changes
                  debouncedApplyScaling();
                  break;
                }
              }
            });
            observer.observe(contentWrapperForObserver, { 
              childList: true, 
              subtree: true, 
              attributes: true, 
              attributeFilter: ['style', 'class', 'id'] 
            });
          }
        </script>
        ${iframeScript} 
      </body>
      </html>
    `;

    useEffect(() => {
      const iframe = localIframeRef.current;
      if (iframe) {
        iframe.srcdoc = srcDocContent; // Dynamically set srcdoc
      }
    }, [srcDocContent]); // Re-run if srcDocContent changes (which it will if htmlContent changes)

    return (
      <iframe
        ref={localIframeRef}
        title="Slide Preview"
        className="w-full h-full border-none bg-white" // iframe itself has white background
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }
);

PreviewPane.displayName = 'PreviewPane';
