
import React from 'react';
import type { Slide } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface SlideListProps {
  slides: Slide[];
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string) => void;
}

export const SlideList: React.FC<SlideListProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
}) => {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onAddSlide}
        className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-150 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
        aria-label="Add new slide"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        New Slide
      </button>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSelectSlide(slide.id)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-150 group ${
              activeSlideId === slide.id
                ? 'bg-sky-600 shadow-lg ring-2 ring-sky-400'
                : 'bg-slate-700 hover:bg-slate-600 hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium truncate text-sm flex-1">
                {index + 1}. {slide.title || `Slide ${index + 1}`}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent slide selection when deleting
                  onDeleteSlide(slide.id);
                }}
                className={`ml-2 p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-800 opacity-50 group-hover:opacity-100 transition-opacity duration-150 ${activeSlideId === slide.id ? 'opacity-100' : ''}`}
                aria-label={`Delete slide ${index + 1}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
         {slides.length === 0 && (
          <p className="text-slate-500 text-center py-4">No slides yet. Add one to get started!</p>
        )}
      </div>
    </div>
  );
};
