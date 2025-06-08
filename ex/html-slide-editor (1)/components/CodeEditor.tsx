
import React, { useRef, useEffect } from 'react';
import type { SelectionRange } from '../types';

interface CodeEditorProps {
  htmlContent: string;
  onChangeContent: (newContent: string) => void;
  selectionRange: SelectionRange | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  htmlContent,
  onChangeContent,
  selectionRange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectionRange && textareaRef.current) {
      textareaRef.current.focus();
      // A brief timeout can help ensure focus is set before selection in some browsers/scenarios
      setTimeout(() => {
        if(textareaRef.current) { // check ref again in case component unmounted
           textareaRef.current.setSelectionRange(selectionRange.start, selectionRange.end);
           // Basic scrolling: try to bring the selection into view by scrolling to a line above it.
            const textToSelection = textareaRef.current.value.substring(0, selectionRange.start);
            const lines = textToSelection.split('\n').length;
            const lineHeight = textareaRef.current.scrollHeight / textareaRef.current.value.split('\n').length; // Approx
            const scrollTop = Math.max(0, (lines - 5) * lineHeight); // scroll to a few lines above, ensure not negative
            textareaRef.current.scrollTop = scrollTop;
        }
      }, 0);
    }
  }, [selectionRange]);

  return (
    <textarea
      ref={textareaRef}
      value={htmlContent}
      onChange={(e) => onChangeContent(e.target.value)}
      className="w-full h-full p-4 bg-slate-800 text-slate-50 border-none focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm resize-none leading-relaxed whitespace-pre"
      spellCheck="false"
      wrap="off" // Use "off" for better code editing experience, rely on horizontal scroll
      aria-label="HTML Code Editor"
    />
  );
};
