import type { Slide } from '../types/domain';

interface SlideListBarProps {
  slides: Slide[];
  activeSlideId: string | null;
  onAddSlide: () => void;
  onDeleteSlide: (slideId: string) => void;
  onSelectSlide: (slideId: string) => void;
}

export function SlideListBar({ 
  slides,
  activeSlideId,
  onAddSlide,
  onDeleteSlide,
  onSelectSlide 
}: SlideListBarProps) {
  return (
    <div className="h-full flex flex-col"> {/* Padding is now handled by App.tsx container */}
      <h2 className="text-xl font-semibold mb-4 shrink-0">Slides</h2>
      <button 
        onClick={onAddSlide}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 shrink-0"
      >
        + Add Slide
      </button>
      <div className="flex-grow overflow-y-auto">
        {slides.map(slide => (
          <div 
            key={slide.id}
            onClick={() => onSelectSlide(slide.id)}
            className={`p-2 mb-2 rounded cursor-pointer hover:bg-gray-300 ${
              slide.id === activeSlideId ? 'bg-blue-200 border-blue-500 border-2' : 'bg-gray-100'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="truncate">{slide.title || `Slide (ID: ${slide.id.substring(0,4)})`}</span>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); // Prevent triggering onSelectSlide
                  onDeleteSlide(slide.id); 
                }}
                className="text-red-500 hover:text-red-700 p-1 text-xs"
                aria-label={`Delete slide ${slide.title || slide.id}`}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        {slides.length === 0 && (
          <p className="text-sm text-gray-500">No slides yet. Add one!</p>
        )}
      </div>
    </div>
  );
}
