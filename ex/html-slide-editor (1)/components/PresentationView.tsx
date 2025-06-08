
import React, { useEffect, useRef, useState } from 'react';
import type { Slide } from '../types';
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentSlideIndex];

  useEffect(() => {
    // Attempt to enter fullscreen
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
      if (!document.fullscreenElement &&
          !(document as any).webkitFullscreenElement && // Safari
          !(document as any).mozFullScreenElement && // Firefox
          !(document as any).msFullscreenElement) { // IE/Edge
        // Exited fullscreen through means other than the app's exit button (e.g. browser's Esc)
        onExit();
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
  }, [onExit]);

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
  }, [currentSlideIndex, slides.length, onExit, onNavigate]);


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
      onNavigate(currentSlideIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
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
  
  const srcDocContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { margin: 0; height: 100vh; width: 100vw; overflow: auto; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; }
        /* Ensure user content takes full height if it's a single root div */
        body > div:first-child:last-child { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      ${currentSlide.htmlContent}
    </body>
    </html>
  `;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = srcDocContent;
    }
  }, [currentSlide.htmlContent, srcDocContent]);


  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white select-none" onMouseMove={resetControlsTimeout}>
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

      {/* Top/Bottom Controls (Exit and Counter) */}
       <div className={`fixed top-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
            onClick={onExit}
            className="p-2 bg-black bg-opacity-40 hover:bg-opacity-60 rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Exit presentation"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <span className="text-sm sm:text-base font-medium bg-black bg-opacity-40 px-3 py-1 rounded-md">
            {currentSlideIndex + 1} / {slides.length}
          </span>
      </div>
    </div>
  );
};
