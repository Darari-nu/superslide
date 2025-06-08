import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Slide } from '../types/domain'; // Adjusted import path
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from './Icons';

interface PresentationViewProps {
  slides: Slide[];
  currentSlideIndex: number;
  onExit: () => void;
  onNavigate: (newIndex: number) => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  slides,
  currentSlideIndex,
  onExit,
  onNavigate,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const navigatingRef = useRef<boolean>(false);

  const currentSlide = slides[currentSlideIndex];

  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) { /* Firefox */
          await (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) { /* IE/Edge */
          await (document.documentElement as any).msRequestFullscreen();
        }
      } catch (err) {
        console.warn("Could not enter fullscreen mode:", err);
      }
    };
    enterFullscreen();

    const handleFullscreenChange = () => {
      // console.log(`FSChange. Fullscreen: ${!!document.fullscreenElement}. Navigating: ${navigatingRef.current}`);
      if (!document.fullscreenElement) { // Fullscreen was exited
        if (navigatingRef.current) {
          // console.log('Fullscreen exited during navigation, consuming flag and ignoring exit.');
          navigatingRef.current = false; // Consume the flag
          return; // Ignore this exit
        } else {
          // console.log('Fullscreen exited, not navigating. Calling onExit.');
          onExit();
        }
      } else {
        // Fullscreen is active or was re-entered. If we were navigating and it was consumed,
        // the flag is already false. No specific action needed here for this strategy.
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE/Edge

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.debug("Error exiting fullscreen on cleanup:", err));
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [onExit]); // navigatingRef.current is accessed directly, so not in deps

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        goToNextSlide();
      } else if (event.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (event.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlideIndex, slides.length, onExit, onNavigate]); // Added onNavigate to dependency array

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // Hide controls after 3 seconds of inactivity
  };

  useEffect(() => {
    resetControlsTimeout(); // Reset on mount and slide change
    window.addEventListener('mousemove', resetControlsTimeout);
    window.addEventListener('touchstart', resetControlsTimeout); // For touch devices

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      window.removeEventListener('mousemove', resetControlsTimeout);
      window.removeEventListener('touchstart', resetControlsTimeout);
    };
  }, [currentSlideIndex]);

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      navigatingRef.current = true;
      onNavigate(currentSlideIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      navigatingRef.current = true;
      onNavigate(currentSlideIndex - 1);
    }
  };

  if (!currentSlide) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
        <p className="text-2xl mb-4">No slide to display.</p>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Exit presentation"
        >
          Exit Presentation
        </button>
      </div>
    );
  }
  
  const getSrcDocContent = useCallback((html: string) => {
    return `
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
          background-color: #000000; /* Match presentation view's outer background */
          /* display: flex; align-items: center; justify-content: center; Removed for margin-based centering */
        }
        #slide-content-wrapper {
          transform-origin: top left; /* Crucial for correct scaling position before centering */
          background-color: #ffffff; /* Default slide background, can be overridden by slide's own styles */
          /* width, height, transform, marginLeft, marginTop will be set by JS */
        }
        /* Add a common class for slides if they have one, e.g., .slide-container */
        /* .slide-container { display: block; } */
      </style>
    </head>
    <body>
      <div id="slide-content-wrapper">
        ${html}
      </div>
      <script>
        function applyScaling() {
          const wrapper = document.getElementById('slide-content-wrapper');
          const body = document.body;
          if (!wrapper || !body) return;

          let slideNativeWidth = 1280; // Default native width
          let slideNativeHeight = 720; // Default native height
          
          // Attempt to get dimensions from a specific slide container class or the first child
          const slideContainer = wrapper.querySelector('.slide-container') || wrapper.children[0];
          if (slideContainer) {
            const computedStyle = window.getComputedStyle(slideContainer);
            let w = parseFloat(computedStyle.width);
            let h = parseFloat(computedStyle.height);
            let minH = parseFloat(computedStyle.minHeight);

            if (!isNaN(w) && w > 0) slideNativeWidth = w;
            // Use height if available, otherwise fallback to minHeight if height is auto or 0
            if (!isNaN(h) && h > 0) slideNativeHeight = h;
            else if (!isNaN(minH) && minH > 0) slideNativeHeight = minH;
          }

          wrapper.style.width = slideNativeWidth + 'px';
          wrapper.style.height = slideNativeHeight + 'px';

          const viewportWidth = body.clientWidth;
          const viewportHeight = body.clientHeight;

          const scaleX = viewportWidth / slideNativeWidth;
          const scaleY = viewportHeight / slideNativeHeight;
          const finalScale = Math.min(scaleX, scaleY) * 0.98; // Apply 2% padding

          wrapper.style.transform = 'scale(' + finalScale + ')';
          
          const scaledWidth = slideNativeWidth * finalScale;
          const scaledHeight = slideNativeHeight * finalScale;
          wrapper.style.marginLeft = (viewportWidth - scaledWidth) / 2 + 'px';
          wrapper.style.marginTop = (viewportHeight - scaledHeight) / 2 + 'px';
          // Removed postMessage call
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
                  (mutation.type === 'attributes' && (mutation.target === contentWrapperForObserver || mutation.target.classList?.contains('slide-container')))) {
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
    </body>
    </html>
  `;
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && currentSlide) {
      // console.log(`[${instanceId}] Updating iframe srcDoc for slide ${currentSlideIndex}. navigatingRef_timestamp: ${navigatingRef.current}`);
      iframe.srcdoc = getSrcDocContent(currentSlide.htmlContent);
    }
    // No direct management of navigatingRef timeout here anymore
  }, [currentSlide, getSrcDocContent]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white select-none" onMouseMove={resetControlsTimeout} onTouchStart={resetControlsTimeout}>
      <iframe
        ref={iframeRef}
        title={`Presentation Slide ${currentSlideIndex + 1}`}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin" 
      />

      {/* Controls Overlay */}
      <div
        className={`fixed inset-0 flex items-center justify-between p-4 sm:p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Previous Button */}
        <button
          onClick={goToPrevSlide}
          disabled={currentSlideIndex === 0}
          className="p-3 bg-black bg-opacity-40 hover:bg-opacity-60 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Next Button */}
        <button
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className="p-3 bg-black bg-opacity-40 hover:bg-opacity-60 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Exit Button (Top Right) */}
      <button
        onClick={onExit}
        className={`fixed top-4 right-4 p-3 bg-black bg-opacity-40 hover:bg-opacity-60 rounded-full text-white transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Exit presentation"
      >
        <XMarkIcon className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* Slide Counter (Bottom Center) */}
      {slides.length > 0 && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black bg-opacity-50 rounded-full text-sm text-white transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {currentSlideIndex + 1} / {slides.length}
        </div>
      )}
    </div>
  );
};

PresentationView.displayName = 'PresentationView';
