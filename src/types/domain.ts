export interface Slide {
  id: string;
  htmlContent: string;
  title?: string; // Optional: for display in slide list
}

export type SlideElementType = 'text' | 'heading' | 'image' | 'list' | 'code_block' | 'generic';

export interface SlideElement {
  id: string; // Corresponds to data-slidesync-id
  type: SlideElementType;
  slideId: string; // ID of the slide this element belongs to
  // Optional: for mapping to code editor lines, might be derived dynamically
  lineNumberStart?: number;
  lineNumberEnd?: number;
}

export interface CodeRange {
  startLine: number;
  endLine: number;
}

export type SelectionType = 'element' | 'slide' | 'code_range' | 'none';

export interface Selection {
  type: SelectionType;
  slideId?: string;    // Relevant if an element or slide is selected
  elementId?: string;  // Relevant if an element is selected
  codeRange?: CodeRange; // Relevant if a code range is selected
}
