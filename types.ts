
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
  userNotes: string;
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
