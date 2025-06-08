import { useState, useEffect, useRef } from 'react';
import { SlideListBar } from './components/SlideListBar';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPane } from './components/PreviewPane';
import type { Slide } from './types/domain';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { PresentationView } from './components/PresentationView';
import { PlayIcon } from './components/Icons';

const initialSlides: Slide[] = [
  {
    id: uuidv4(),
    title: 'Welcome Slide',
    htmlContent: '<h1>Welcome to SlideSync!</h1>\n<p>Edit this slide or add a new one.</p>'
  },
  {
    id: uuidv4(),
    title: 'Second Slide',
    htmlContent: '<h2>Features</h2>\n<ul>\n  <li>Real-time preview</li>\n  <li>Code highlighting (soon!)</li>\n</ul>'
  },
];

function App() {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(
    initialSlides.length > 0 ? initialSlides[0].id : null
  );
  const [editorContent, setEditorContent] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewScale, setPreviewScale] = useState<number>(1.0);
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    // Load active slide content into editor
    const activeSlide = slides.find(s => s.id === activeSlideId);
    if (activeSlide) {
      setEditorContent(activeSlide.htmlContent);
    } else if (slides.length > 0) {
      // If no active slide but slides exist, activate the first one
      setActiveSlideId(slides[0].id);
      setEditorContent(slides[0].htmlContent);
    } else {
      // No slides exist
      setEditorContent('');
    }
  }, [activeSlideId, slides]);

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: uuidv4(),
      title: `Slide ${slides.length + 1}`,
      htmlContent: '<h1>New Slide</h1>\n<p>Start editing...</p>',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const handleDeleteSlide = (slideId: string) => {
    setSlides(slides.filter(s => s.id !== slideId));
    if (activeSlideId === slideId) {
      // If active slide is deleted, select the first available slide or null
      setActiveSlideId(slides.length > 1 ? slides.find(s => s.id !== slideId)?.id || null : null);
    }
  };

  const handleSelectSlide = (slideId: string) => {
    setActiveSlideId(slideId);
  };

  const handleEditorChange = (newContent: string) => {
    setEditorContent(newContent);
    // Update the content of the active slide
    setSlides(slides.map(s => 
      s.id === activeSlideId ? { ...s, htmlContent: newContent } : s
    ));
  };

  const handleZoomIn = () => {
    setPreviewScale(prevScale => Math.min(prevScale + 0.1, 3.0)); // Max zoom 300%
  };

  const handlePresent = () => {
    if (slides.length > 0 && activeSlideId) {
      setIsPresenting(true);
    } else {
      console.warn("Cannot start presentation: No active slide or no slides available.");
      // Optionally, provide user feedback here, e.g., using a toast notification
    }
  };

  const handleExitPresent = () => {
    setIsPresenting(false);
    // Attempt to exit fullscreen if PresentationView didn't (e.g. due to unmount)
    if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.debug("App: Error exiting fullscreen:", err));
      } else if ((document as any).webkitExitFullscreen) { /* Safari */
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { /* Firefox */
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) { /* IE/Edge */
        (document as any).msExitFullscreen();
      }
    }
  };
  
  const handleNavigatePresent = (newIndex: number) => {
    if (slides[newIndex]) {
      setActiveSlideId(slides[newIndex].id);
    }
  };

  const handleZoomOut = () => {
    setPreviewScale(prevScale => Math.max(prevScale - 0.1, 0.2)); // Min zoom 20%
  };

  const activeSlide = slides.find(s => s.id === activeSlideId);

  const currentSlideIndex = slides.findIndex(s => s.id === activeSlideId);

  if (isPresenting && activeSlideId !== null && currentSlideIndex !== -1) {
    return (
      <PresentationView
        slides={slides}
        currentSlideIndex={currentSlideIndex}
        onExit={handleExitPresent}
        onNavigate={handleNavigatePresent}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-800 text-white overflow-hidden text-sm"> {/* Dark theme base */}
      {/* Slide List Bar - Fixed Width, Darker Background, Padding */}
      <div className="w-64 bg-slate-900 p-4 flex-shrink-0 flex flex-col overflow-y-auto">
        <SlideListBar 
          slides={slides}
          activeSlideId={activeSlideId}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onSelectSlide={handleSelectSlide}
        />
      </div>

      {/* Code Editor - Flexible Width, Inherits Dark Background */}
      <div className="flex-1 flex flex-col overflow-hidden"> 
        {activeSlide ? (
          <CodeEditor 
            content={editorContent}
            onChange={handleEditorChange}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <p className="text-xl">Select a slide to edit or add a new one.</p>
          </div>
        )}
      </div>

      {/* Preview Pane - Flexible Width, Light Background for Content Area, Dark Border */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden border-l border-slate-700 p-4">
        {/* Preview Title and Zoom Controls */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Preview</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleZoomOut}
              className="px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded text-xs font-mono disabled:opacity-50"
              aria-label="Zoom Out"
              disabled={previewScale <= 0.2}
            >
              -
            </button>
            <span className="text-sm text-slate-700 w-10 text-center">{(previewScale * 100).toFixed(0)}%</span>
            <button
              onClick={handleZoomIn}
              className="px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded text-xs font-mono disabled:opacity-50"
              aria-label="Zoom In"
              disabled={previewScale >= 3.0}
            >
              +
            </button>
            <button
              onClick={handlePresent}
              className="ml-4 px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded text-xs flex items-center disabled:opacity-50"
              aria-label="Start Presentation"
              title="Start Presentation"
              disabled={slides.length === 0 || !activeSlideId}
            >
              <PlayIcon className="w-3 h-3 mr-1" /> 
              Present
            </button>
          </div>
        </div>
        {/* Container for the iframe, ensuring it takes remaining space */}
        <div className="flex-grow bg-white border border-gray-300 rounded shadow-inner overflow-hidden">
          {activeSlide ? (
            <PreviewPane 
              ref={iframeRef}
              htmlContent={activeSlide.htmlContent}
              scale={previewScale}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center text-gray-500 p-4">
              <div>
                <p>No slide selected or no slides available.</p>
                <p>Click "Add Slide" to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
