import { useState, useEffect, useRef } from 'react';
import { SlideListBar } from './components/SlideListBar';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPane } from './components/PreviewPane';
import type { Slide } from './types/domain';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

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

  const activeSlide = slides.find(s => s.id === activeSlideId);

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
        {/* Preview Title - moved from PreviewPane */}
        <h2 className="text-xl font-semibold mb-4 shrink-0 text-slate-800">Preview</h2>
        {/* Container for the iframe, ensuring it takes remaining space */}
        <div className="flex-grow bg-white border border-gray-300 rounded shadow-inner overflow-hidden">
          {activeSlide ? (
            <PreviewPane 
              ref={iframeRef}
              htmlContent={activeSlide.htmlContent}
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
