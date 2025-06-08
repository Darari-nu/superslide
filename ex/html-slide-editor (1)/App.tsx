
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SlideList } from './components/SlideList';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPane } from './components/PreviewPane';
import { PresentationView } from './components/PresentationView';
import type { Slide, SelectionRange } from './types';
import { DEFAULT_SLIDE_CONTENT } from './constants';
import { PlayIcon } from './components/Icons';

const App: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>(() => {
    const savedSlides = localStorage.getItem('slides');
    if (savedSlides) {
      return JSON.parse(savedSlides);
    }
    return [
      { id: Date.now().toString(), title: 'Slide 1', htmlContent: DEFAULT_SLIDE_CONTENT }
    ];
  });

  const [activeSlideId, setActiveSlideId] = useState<string | null>(slides.length > 0 ? slides[0].id : null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationSlideIndex, setPresentationSlideIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    localStorage.setItem('slides', JSON.stringify(slides));
  }, [slides]);

  const handleAddSlide = useCallback(() => {
    const newSlideId = Date.now().toString();
    const newSlide: Slide = {
      id: newSlideId,
      title: `Slide ${slides.length + 1}`,
      htmlContent: DEFAULT_SLIDE_CONTENT,
    };
    setSlides(prevSlides => [...prevSlides, newSlide]);
    setActiveSlideId(newSlideId);
    setSelectionRange(null);
  }, [slides.length]);

  const handleDeleteSlide = useCallback((slideIdToDelete: string) => {
    setSlides(prevSlides => {
      const currentDeletingIndex = prevSlides.findIndex(s => s.id === slideIdToDelete);
      const newSlides = prevSlides.filter(slide => slide.id !== slideIdToDelete);
      
      if (activeSlideId === slideIdToDelete) {
        if (newSlides.length > 0) {
          const nextActiveIndex = Math.max(0, Math.min(currentDeletingIndex, newSlides.length - 1));
          setActiveSlideId(newSlides[nextActiveIndex]?.id || null);
        } else {
          setActiveSlideId(null);
        }
      }
      return newSlides;
    });
    setSelectionRange(null);
  }, [activeSlideId]);

  const handleUpdateSlideContent = useCallback((slideId: string, newContent: string) => {
    setSlides(prevSlides =>
      prevSlides.map(slide =>
        slide.id === slideId ? { ...slide, htmlContent: newContent } : slide
      )
    );
     const h1Match = newContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
     if (h1Match && h1Match[1]) {
       setSlides(prevSlides =>
         prevSlides.map(slide =>
           slide.id === slideId ? { ...slide, title: h1Match[1].trim().substring(0,30) || `Slide ${prevSlides.findIndex(s => s.id === slideId) + 1}` } : slide
         )
       );
     }
  }, []);

  const activeSlide = slides.find(slide => slide.id === activeSlideId);
  const activeSlideIndex = slides.findIndex(slide => slide.id === activeSlideId);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || !event.data || event.data.type !== 'previewElementClicked') {
        return;
      }
      
      const { outerHTML } = event.data;
      if (activeSlide && outerHTML) {
        const code = activeSlide.htmlContent;
        const startIndex = code.indexOf(outerHTML);
        if (startIndex !== -1) {
          setSelectionRange({ start: startIndex, end: startIndex + outerHTML.length });
        } else {
          setSelectionRange(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [activeSlide, iframeRef]);

  const handleStartPresentation = () => {
    const startIndex = activeSlideIndex !== -1 ? activeSlideIndex : 0;
    if (slides.length > 0) {
      setPresentationSlideIndex(startIndex);
      setIsPresenting(true);
    } else {
      alert("Please add some slides before starting a presentation.");
    }
  };

  const handleExitPresentation = () => {
    setIsPresenting(false);
    // Update active slide to the one that was being presented
    if (slides[presentationSlideIndex]) {
      setActiveSlideId(slides[presentationSlideIndex].id);
    }
     if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
  };

  const handleNavigatePresentation = (newIndex: number) => {
    setPresentationSlideIndex(newIndex);
  };

  if (isPresenting) {
    return (
      <PresentationView
        slides={slides}
        currentSlideIndex={presentationSlideIndex}
        onExit={handleExitPresentation}
        onNavigate={handleNavigatePresentation}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-800 text-white overflow-hidden">
      <div className="w-64 bg-slate-900 p-4 flex flex-col overflow-y-auto">
        <button
          onClick={handleStartPresentation}
          disabled={slides.length === 0}
          className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-150 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-slate-600 disabled:cursor-not-allowed"
          aria-label="Start presentation"
        >
          <PlayIcon className="w-5 h-5 mr-2" />
          Present
        </button>
        <SlideList
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={(id) => { setActiveSlideId(id); setSelectionRange(null);}}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
        />
      </div>
      <div className="flex-1 flex flex-col bg-slate-800 overflow-hidden">
        {activeSlide ? (
          <CodeEditor
            htmlContent={activeSlide.htmlContent}
            onChangeContent={(newContent) => handleUpdateSlideContent(activeSlide.id, newContent)}
            selectionRange={selectionRange}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <p className="text-xl">Select a slide to edit or add a new one.</p>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col bg-gray-200 overflow-hidden border-l border-slate-700">
         {activeSlide ? (
          <PreviewPane htmlContent={activeSlide.htmlContent} ref={iframeRef} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-200">
             <p className="text-xl">Preview will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
