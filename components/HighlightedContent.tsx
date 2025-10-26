import React from 'react';
import { Annotation } from '../types';

const Highlight: React.FC<{ annotation: Annotation, onClick: (e: React.MouseEvent<HTMLElement>) => void }> = ({ annotation, onClick }) => {
    return (
        <mark 
            onClick={onClick}
            className="bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-300 cursor-pointer rounded px-1 py-0.5"
        >
            {annotation.targetText}
        </mark>
    );
};

const HighlightedContent: React.FC<{ 
    text: string, 
    conceptId: string,
    fieldName: 'definition' | 'notes', // Removed 'codeExample' as it's handled by CodeSnippet
    annotations: Annotation[],
    onHighlightClick: (annotation: Annotation, target: HTMLElement) => void,
    isSpeaking: boolean,
    onMouseUp: (e: React.MouseEvent<HTMLElement>) => void; // Added onMouseUp prop
}> = ({ text, conceptId, fieldName, annotations, onHighlightClick, isSpeaking, onMouseUp }) => { // Added onMouseUp to destructuring

    const relevantAnnotations = annotations
        .filter(a => a.conceptId === conceptId && a.fieldName === fieldName)
        .sort((a, b) => a.startIndex - b.startIndex);

    if (!text || relevantAnnotations.length === 0) {
        return <pre onMouseUp={onMouseUp} className={`text-sm font-sans whitespace-pre-wrap break-words p-2 rounded-md transition-all duration-300 ease-in-out ${isSpeaking ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''}`}>{text}</pre>;
    }
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    relevantAnnotations.forEach((annotation) => {
        if (annotation.startIndex > lastIndex) {
            parts.push(text.substring(lastIndex, annotation.startIndex));
        }
        parts.push(
            <Highlight 
                key={annotation.id} 
                annotation={annotation} 
                onClick={(e) => onHighlightClick(annotation, e.currentTarget)} 
            />
        );
        lastIndex = annotation.endIndex;
    });

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return (
        <pre onMouseUp={onMouseUp} className={`text-sm font-sans whitespace-pre-wrap break-words p-2 rounded-md select-text transition-all duration-300 ease-in-out ${isSpeaking ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''}`}>
            {parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}
        </pre>
    );
};

export default HighlightedContent;
