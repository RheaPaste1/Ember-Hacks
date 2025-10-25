
export interface Annotation {
  id: string;
  conceptId: string;
  fieldName: 'definition' | 'notes' | 'codeExample';
  targetText: string;
  note: string;
  startIndex: number;
  endIndex: number;
}

export interface Concept {
  id: string;
  term: string;
  definition: string;
  notes: string;
  visualExample: string;
  codeExample: string;
}

export interface Lesson {
  id: string;
  topic: string;
  concepts: Concept[];
  annotations: Annotation[];
}

export interface Folder {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}