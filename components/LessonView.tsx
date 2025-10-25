
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Lesson, Concept, Annotation } from '../types';
import { Chatbot } from './Chatbot';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from './Icons';

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const Highlight: React.FC<{ annotation: Annotation, onClick: () => void }> = ({ annotation, onClick }) => {
    return (
        <mark 
            onClick={onClick}
            className="bg-blue-500/30 hover:bg-blue-500/50 cursor-pointer rounded px-1 py-0.5"
        >
            {annotation.targetText}
        </mark>
    );
};

const HighlightedContent: React.FC<{ 
    text: string, 
    conceptId: string,
    annotations: Annotation[],
    onHighlightClick: (annotation: Annotation, target: HTMLElement) => void 
}> = ({ text, conceptId, annotations, onHighlightClick }) => {

    const relevantAnnotations = annotations.filter(a => a.conceptId === conceptId);

    if (!text || relevantAnnotations.length === 0) {
        return <pre className="text-sm font-sans whitespace-pre-wrap break-words">{text}</pre>;
    }

    const matches: { start: number; end: number; annotation: Annotation }[] = [];
    relevantAnnotations.forEach(annotation => {
        const regex = new RegExp(escapeRegExp(annotation.targetText), 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({ start: match.index, end: match.index + match[0].length, annotation });
        }
    });
    
    matches.sort((a, b) => a.start - b.start);

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach(({ start, end, annotation }, index) => {
        if (start > lastIndex) {
            parts.push(text.substring(lastIndex, start));
        }
        parts.push(
            <Highlight 
                key={`${annotation.id}-${index}`} 
                annotation={annotation} 
                onClick={(e) => onHighlightClick(annotation, e.currentTarget)} 
            />
        );
        lastIndex = end;
    });

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return (
        <pre className="text-sm font-sans whitespace-pre-wrap break-words">
            {parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}
        </pre>
    );
};

const NotePopover: React.FC<{
    annotation: Annotation;
    onSave: (note: string) => void;
    onDelete: () => void;
    onClose: () => void;
    popoverStyle: React.CSSProperties;
}> = ({ annotation, onSave, onDelete, onClose, popoverStyle }) => {
    const [noteText, setNoteText] = useState(annotation.note);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    return (
        <div ref={popoverRef} style={popoverStyle} className="fixed z-20 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 flex flex-col">
            <h5 className="text-sm font-bold text-gray-300 mb-2">Note for: <span className="font-normal italic text-blue-400">"{annotation.targetText}"</span></h5>
            <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="mt-3 flex justify-between items-center">
                <button onClick={() => onDelete()} className="p-2 text-gray-400 hover:text-red-400">
                    <TrashIcon className="w-5 h-5"/>
                </button>
                <div className="space-x-2">
                    <button onClick={onClose} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Cancel</button>
                    <button onClick={() => onSave(noteText)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Save</button>
                </div>
            </div>
        </div>
    );
};

// Fix: Define LessonViewProps interface.
interface LessonViewProps {
    lesson: Lesson;
    onUpdateLesson: (updatedLesson: Lesson) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, onUpdateLesson }) => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(true);
    const [popover, setPopover] = useState<{ type: 'add' | 'edit', data: any, style: React.CSSProperties } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleMouseUp = (conceptId: string) => (e: React.MouseEvent) => {
        if (popover) return;
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setPopover({
                type: 'add',
                data: {
                    text: selection.toString().trim(),
                    conceptId: conceptId,
                },
                style: {
                    top: `${rect.bottom + window.scrollY + 5}px`,
                    left: `${rect.left + window.scrollX}px`,
                }
            });
            selection.removeAllRanges();
        }
    };
    
    const handleAddAnnotation = () => {
        if (popover?.type !== 'add') return;
        const { text, conceptId } = popover.data;
        const newAnnotation: Annotation = {
            id: self.crypto.randomUUID(),
            conceptId,
            targetText: text,
            note: '',
        };
        onUpdateLesson({ ...lesson, annotations: [...(lesson.annotations || []), newAnnotation] });
        setPopover(null);
    };

    const handleHighlightClick = (annotation: Annotation, target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        setPopover({
            type: 'edit',
            data: annotation,
            style: {
                top: `${rect.bottom + window.scrollY + 5}px`,
                left: `${rect.left + window.scrollX}px`,
            }
        });
    };
    
    const handleSaveAnnotation = (note: string) => {
        if (popover?.type !== 'edit') return;
        const updatedAnnotations = (lesson.annotations || []).map(a => 
            a.id === popover.data.id ? { ...a, note } : a
        );
        onUpdateLesson({ ...lesson, annotations: updatedAnnotations });
        setPopover(null);
    };

    const handleDeleteAnnotation = () => {
        if (popover?.type !== 'edit') return;
        const updatedAnnotations = (lesson.annotations || []).filter(a => a.id !== popover.data.id);
        onUpdateLesson({ ...lesson, annotations: updatedAnnotations });
        setPopover(null);
    };
    
    return (
        <div className="flex h-full overflow-hidden">
            <main ref={contentRef} className="flex-1 overflow-y-auto p-8" onMouseUp={() => { if (window.getSelection()?.toString().length === 0 && popover?.type === 'add') setPopover(null)}}>
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4 text-white tracking-tight">{lesson.topic}</h1>

                    {lesson.concepts.map((concept, index) => (
                        <div key={concept.id} className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
                            <h3 className="text-2xl font-semibold mb-4 text-blue-400">{index + 1}. {concept.term}</h3>
                            
                            <div className="space-y-6" onMouseUp={handleMouseUp(concept.id)}>
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Definition</h4>
                                    <div className="prose prose-invert prose-sm max-w-none p-2 rounded-md select-text">
                                        <HighlightedContent text={concept.definition} conceptId={concept.id} annotations={lesson.annotations || []} onHighlightClick={handleHighlightClick} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Notes & Edge Cases</h4>
                                    <div className="prose prose-invert prose-sm max-w-none p-2 rounded-md select-text">
                                         <HighlightedContent text={concept.notes} conceptId={concept.id} annotations={lesson.annotations || []} onHighlightClick={handleHighlightClick} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Visual Example</h4>
                                    <div className="p-4 border border-dashed border-gray-600 rounded-md bg-gray-900">
                                        <p className="italic text-gray-400">{concept.visualExample}</p>
                                        <img src={`httpshttps://picsum.photos/seed/${concept.id}/600/300`} alt={concept.visualExample} className="mt-4 rounded-md" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-2">Code Example</h4>
                                    <div className="bg-gray-900 rounded-md p-4 select-text">
                                        <HighlightedContent text={concept.codeExample} conceptId={concept.id} annotations={lesson.annotations || []} onHighlightClick={handleHighlightClick} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            
             {popover?.type === 'add' && (
                <div style={popover.style} className="fixed z-20">
                    <button onClick={handleAddAnnotation} className="flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md shadow-lg hover:bg-blue-600">
                        <PlusIcon className="w-4 h-4 mr-2"/>
                        Add Note
                    </button>
                </div>
            )}

            {popover?.type === 'edit' && (
                <NotePopover 
                    annotation={popover.data}
                    onSave={handleSaveAnnotation}
                    onDelete={handleDeleteAnnotation}
                    onClose={() => setPopover(null)}
                    popoverStyle={popover.style}
                />
            )}
            
            <aside className="flex flex-shrink-0">
                <div className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isChatbotOpen ? 'w-[400px]' : 'w-0'}`}>
                    <Chatbot lesson={lesson} onUpdateLesson={onUpdateLesson} />
                </div>
                 <div className="flex items-center justify-center bg-gray-800 border-l border-gray-700">
                    <button 
                        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                        className="h-full px-2 py-4 flex flex-col items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none w-10"
                        aria-label={isChatbotOpen ? "Hide assistant" : "Show assistant"}
                        aria-expanded={isChatbotOpen}
                    >
                         {isChatbotOpen ? (
                            <ChevronRightIcon className="w-5 h-5" />
                         ) : (
                            <>
                                <ChevronLeftIcon className="w-5 h-5 mb-2 flex-shrink-0" />
                                <span 
                                    className="text-xs font-semibold uppercase tracking-wider"
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                                >
                                    Assistant
                                </span>
                            </>
                         )}
                    </button>
                </div>
            </aside>
        </div>
    );
};