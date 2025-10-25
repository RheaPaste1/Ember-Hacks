
import React, { useState } from 'react';
import { Lesson, Concept } from '../types';
import { Chatbot } from './Chatbot';

interface LessonViewProps {
  lesson: Lesson;
  onUpdateLesson: (updatedLesson: Lesson) => void;
}

const EditableSection: React.FC<{ value: string; onSave: (newValue: string) => void }> = ({ value, onSave }) => {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(value);
    
    const handleSave = () => {
        onSave(text);
        setEditing(false);
    };

    if (editing) {
        return (
            <div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                />
                <div className="mt-2 space-x-2">
                    <button onClick={handleSave} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Save</button>
                    <button onClick={() => setEditing(false)} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Cancel</button>
                </div>
            </div>
        );
    }
    
    return (
        <div onClick={() => setEditing(true)} className="prose prose-invert prose-sm max-w-none hover:bg-gray-800 p-2 rounded-md cursor-pointer transition-colors">
            <pre className="text-sm font-sans whitespace-pre-wrap break-words">{value}</pre>
        </div>
    );
};


export const LessonView: React.FC<LessonViewProps> = ({ lesson, onUpdateLesson }) => {
    
    const handleUpdateConcept = (conceptId: string, field: keyof Concept, value: string) => {
        const updatedConcepts = lesson.concepts.map(c => 
            c.id === conceptId ? { ...c, [field]: value } : c
        );
        onUpdateLesson({ ...lesson, concepts: updatedConcepts });
    };

    const handleUpdateUserNotes = (value: string) => {
        onUpdateLesson({ ...lesson, userNotes: value });
    };

    return (
        <div className="flex h-full overflow-hidden">
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4 text-white tracking-tight">{lesson.topic}</h1>
                    <div className="mb-8 p-4 bg-gray-800 rounded-lg">
                        <h2 className="text-2xl font-semibold mb-2 text-blue-400">My Notes</h2>
                        <EditableSection value={lesson.userNotes} onSave={handleUpdateUserNotes} />
                    </div>

                    {lesson.concepts.map((concept, index) => (
                        <div key={concept.id} className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
                            <h3 className="text-2xl font-semibold mb-4 text-blue-400">{index + 1}. {concept.term}</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Definition</h4>
                                    <EditableSection value={concept.definition} onSave={(v) => handleUpdateConcept(concept.id, 'definition', v)} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Notes & Edge Cases</h4>
                                    <EditableSection value={concept.notes} onSave={(v) => handleUpdateConcept(concept.id, 'notes', v)} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Visual Example</h4>
                                    <div className="p-4 border border-dashed border-gray-600 rounded-md bg-gray-900">
                                        <p className="italic text-gray-400">{concept.visualExample}</p>
                                        <img src={`https://picsum.photos/seed/${concept.id}/600/300`} alt={concept.visualExample} className="mt-4 rounded-md" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Code Example</h4>
                                    <div className="bg-gray-900 rounded-md p-4">
                                        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-cyan-300"><code><EditableSection value={concept.codeExample} onSave={(v) => handleUpdateConcept(concept.id, 'codeExample', v)} /></code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            <Chatbot lesson={lesson} onUpdateLesson={onUpdateLesson} />
        </div>
    );
};
