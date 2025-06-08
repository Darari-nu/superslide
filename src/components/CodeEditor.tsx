import React from 'react';

interface CodeEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

export function CodeEditor({ content, onChange }: CodeEditorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="text-white p-4 h-full flex flex-col"> {/* Adjusted for flex layout from App.tsx */}
      <h2 className="text-xl font-semibold mb-4 shrink-0">Code Editor</h2>
      <textarea 
        className="w-full flex-grow bg-gray-900 text-green-400 font-mono p-3 rounded border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
        value={content}
        onChange={handleChange}
        spellCheck="false"
      />
    </div>
  );
}
