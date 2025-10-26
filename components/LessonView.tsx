import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Concept, Annotation } from '../types';
import { Chatbot } from './Chatbot';
import { VisualExampleDisplay } from './VisualExampleDisplay';
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon, BookOpenIcon, PencilIcon, EyeIcon, CodeBracketIcon, ClipboardIcon, CheckIcon } from './Icons';

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
    onHighlightClick: (annotation: Annotation, target: HTMLElement) => void 
}> = ({ text, conceptId, fieldName, annotations, onHighlightClick }) => {

    const relevantAnnotations = annotations
        .filter(a => a.conceptId === conceptId && a.fieldName === fieldName)
        .sort((a, b) => a.startIndex - b.startIndex);

    if (!text || relevantAnnotations.length === 0) {
        return <pre className="text-sm font-sans whitespace-pre-wrap break-words">{text}</pre>;
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
        <pre className="text-sm font-sans whitespace-pre-wrap break-words">
            {parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}
        </pre>
    );
};

const CodeSnippet: React.FC<{
    codeBlock: string;
    conceptId: string;
    fieldName: 'codeExample';
    annotations: Annotation[];
    onHighlightClick: (annotation: Annotation, target: HTMLElement) => void;
    onMouseUp: (e: React.MouseEvent<HTMLElement>) => void;
}> = ({ codeBlock, conceptId, fieldName, annotations, onHighlightClick, onMouseUp }) => {
    const [isCopied, setIsCopied] = useState(false);

    const parseCodeBlock = (block: string) => {
        const match = block.match(/^```(\w*)\n([\s\S]*?)```$/);
        if (match) {
            const code = match[2].trim();
            return { language: match[1] || 'plaintext', code };
        }
        const trimmedBlock = block.trim();
        if (trimmedBlock.startsWith('```') && trimmedBlock.endsWith('```')) {
             return { language: 'plaintext', code: trimmedBlock.slice(3, -3).trim() };
        }
        return { language: 'plaintext', code: block };
    };

    const { language, code } = parseCodeBlock(codeBlock);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const SyntaxHighlightedText: React.FC<{ text: string }> = ({ text }) => {
        // Define token types with regex and CSS classes in order of precedence.
        const tokenDefinitions = [
            // Each regex must have ONE capturing group for the content.
            { type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/, className: 'text-gray-500 italic' },
            { type: 'string', regex: /(".*?"|'.*?'|`.*?`)/, className: 'text-yellow-300' },
            { type: 'keyword', regex: /\b(public|private|protected|static|final|void|class|interface|enum|extends|implements|new|import|package|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|const|let|var|function|async|await|export|default|int|boolean|double|float|true|false|null|this|from|of|in|type|instanceof|delete|yield)\b/, className: 'text-fuchsia-400' },
            { type: 'number', regex: /\b(\d+\.?\d*)\b/, className: 'text-orange-400' },
            { type: 'function', regex: /(\w+)(?=\s*\()/, className: 'text-cyan-400' },
            { type: 'className', regex: /\b([A-Z][a-zA-Z0-9_]*)\b/, className: 'text-sky-400' },
            { type: 'operator', regex: /([=+\-*/%&|<>!^~?:.]+)/, className: 'text-fuchsia-400' },
            { type: 'punctuation', regex: /([{}()\[\].,;])/, className: 'text-gray-300' },
        ];
        
        // Combine all regexes into one for matching.
        const masterRegex = new RegExp(tokenDefinitions.map(t => t.regex.source).join('|'), 'g');
        
        const finalElements: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = masterRegex.exec(text)) !== null) {
            // Unmatched text before the current match
            if (match.index > lastIndex) {
                finalElements.push(
                    <span key={`text-${lastIndex}`} className="text-slate-300">
                        {text.substring(lastIndex, match.index)}
                    </span>
                );
            }
    
            let groupOffset = 1;
            let found = false;
            for (const tokenDef of tokenDefinitions) {
                const numGroupsInRegex = (new RegExp(tokenDef.regex.source + '|')).exec('')!.length - 1;
                if (match[groupOffset] !== undefined) {
                    let className = tokenDef.className;
                     // Heuristic for constructor calls: `new MyClass()`
                     // `MyClass` matches both 'function' and 'className'. Since `function` is first, it wins.
                     // We need to correct it to 'className' style if it's preceded by 'new'.
                     if (tokenDef.type === 'function' && /^[A-Z]/.test(match[0])) {
                        const precedingText = text.substring(0, match.index).trim();
                        if (precedingText.endsWith('new')) {
                            className = 'text-sky-400';
                        }
                     }
                    finalElements.push(
                        <span key={`token-${match.index}`} className={className}>
                            {match[0]}
                        </span>
                    );
                    found = true;
                    break;
                }
                groupOffset += numGroupsInRegex;
            }
    
            if(!found) {
                // Fallback for the whole match if no group was identified
                finalElements.push(
                    <span key={`text-${lastIndex}`} className="text-slate-300">
                        {match[0]}
                    </span>
                );
            }
    
            lastIndex = masterRegex.lastIndex;
        }
        
        // Remaining text
        if (lastIndex < text.length) {
            finalElements.push(
                <span key={`text-${lastIndex}`} className="text-slate-300">
                    {text.substring(lastIndex)}
                </span>
            );
        }
        
        return <>{finalElements.map((el, i) => <React.Fragment key={i}>{el}</React.Fragment>)}</>;
    };

    const renderContentWithHighlights = () => {
        const relevantAnnotations = annotations
            .filter(a => a.conceptId === conceptId && a.fieldName === fieldName)
            .sort((a, b) => a.startIndex - b.startIndex);

        if (relevantAnnotations.length === 0) {
            return <SyntaxHighlightedText text={code} />;
        }
        
        const contentParts: React.ReactNode[] = [];
        let lastIndex = 0;

        relevantAnnotations.forEach((annotation) => {
            if (annotation.startIndex > lastIndex) {
                const textSegment = code.substring(lastIndex, annotation.startIndex);
                contentParts.push(<SyntaxHighlightedText key={`text-${lastIndex}`} text={textSegment} />);
            }
            contentParts.push(
                <mark 
                    key={annotation.id}
                    onClick={(e) => onHighlightClick(annotation, e.currentTarget)}
                    className="bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-300 cursor-pointer rounded px-1 py-0.5"
                >
                    <SyntaxHighlightedText text={annotation.targetText} />
                </mark>
            );
            lastIndex = annotation.endIndex;
        });

        if (lastIndex < code.length) {
            const textSegment = code.substring(lastIndex);
            contentParts.push(<SyntaxHighlightedText key={`text-${lastIndex}`} text={textSegment} />);
        }

        return contentParts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>);
    };

    return (
        <div className="bg-gray-900 rounded-md overflow-hidden mt-2 border border-gray-700/50">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50">
                <span className="text-xs font-sans text-gray-400 uppercase">{language}</span>
                <button onClick={handleCopy} className="text-xs flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors duration-200">
                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-400"/> : <ClipboardIcon className="w-4 h-4"/>}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div onMouseUp={onMouseUp} className="p-4 text-sm font-mono whitespace-pre-wrap break-words select-text overflow-x-auto">
                <code>
                    {renderContentWithHighlights()}
                </code>
            </div>
        </div>
    );
};

const NotePopover: React.FC<{
    annotation: Annotation;
    onSave: (note: string) => void;
    onDelete: () => void;
    onClose: () => void;
    popoverStyle: React.CSSProperties;
    isNew: boolean;
}> = ({ annotation, onSave, onDelete, onClose, popoverStyle, isNew }) => {
    const [noteText, setNoteText] = useState(annotation.note);
    const popoverRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    useEffect(() => {
        if (isNew) {
            textareaRef.current?.focus();
        }
    }, [isNew]);
    
    return (
        <div ref={popoverRef} style={popoverStyle} className="fixed z-20 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 flex flex-col popover-active">
            <h5 className="text-sm font-bold text-gray-300 mb-2">Note for: <span className="font-normal italic text-yellow-400">"{annotation.targetText}"</span></h5>
            <textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                aria-label="Annotation note"
            />
            <div className="mt-3 flex justify-between items-center">
                <button onClick={() => onDelete()} className="p-2 text-gray-400 hover:text-red-400" aria-label="Delete note">
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

interface LessonViewProps {
    lesson: Lesson;
    onUpdateLesson: (updatedLesson: Lesson) => void;
}

const getSelectionOffsets = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (!element.contains(range.commonAncestorContainer)) {
        return null;
    }

    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(element);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preSelectionRange.toString().length;

    return {
        startIndex,
        endIndex: startIndex + range.toString().length,
    };
};

export const LessonView: React.FC<LessonViewProps> = ({ lesson, onUpdateLesson }) => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(true);
    const [popover, setPopover] = useState<{ data: Annotation, style: React.CSSProperties, isNew: boolean } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleMouseUp = (conceptId: string, fieldName: 'definition' | 'notes' | 'codeExample') => (e: React.MouseEvent) => {
        if (popover) {
            if (!(e.target as HTMLElement).closest('.popover-active')) {
                setPopover(null);
            }
            return;
        }

        const selection = window.getSelection();
        const selectionText = selection?.toString() ?? '';

        if (selection && selectionText.trim().length > 0) {
            if ((selection.anchorNode?.parentElement as HTMLElement)?.tagName === 'MARK' || (selection.focusNode?.parentElement as HTMLElement)?.tagName === 'MARK') {
                 selection.removeAllRanges();
                 return;
            }

            const offsets = getSelectionOffsets(e.currentTarget as HTMLElement);
            if (offsets) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                selection.removeAllRanges();

                const newAnnotation: Annotation = {
                    id: self.crypto.randomUUID(),
                    conceptId,
                    fieldName,
                    targetText: selectionText,
                    note: '',
                    startIndex: offsets.startIndex,
                    endIndex: offsets.endIndex,
                };
                
                onUpdateLesson({ ...lesson, annotations: [...(lesson.annotations || []), newAnnotation] });

                setPopover({
                    data: newAnnotation,
                    style: {
                        top: `${rect.bottom + window.scrollY + 5}px`,
                        left: `${rect.left + window.scrollX}px`,
                    },
                    isNew: true,
                });
            }
        }
    };
    
    const handleHighlightClick = (annotation: Annotation, target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        setPopover({
            data: annotation,
            style: {
                top: `${rect.bottom + window.scrollY + 5}px`,
                left: `${rect.left + window.scrollX}px`,
            },
            isNew: false,
        });
    };
    
    const handleSaveAnnotation = (note: string) => {
        if (!popover) return;
        const updatedAnnotations = (lesson.annotations || []).map(a => 
            a.id === popover.data.id ? { ...a, note } : a
        );
        onUpdateLesson({ ...lesson, annotations: updatedAnnotations });
        setPopover(null);
    };

    const handleDeleteAnnotation = () => {
        if (!popover) return;
        const updatedAnnotations = (lesson.annotations || []).filter(a => a.id !== popover.data.id);
        onUpdateLesson({ ...lesson, annotations: updatedAnnotations });
        setPopover(null);
    };
    
    return (
        <div className="flex h-full overflow-hidden">
            <main 
                ref={contentRef} 
                className="flex-1 overflow-y-auto p-8" 
                onMouseUp={(e) => { 
                    const selection = window.getSelection();
                    if (selection?.toString().length === 0 && popover && !(e.target as HTMLElement).closest('.popover-active')) {
                        setPopover(null);
                    }
                }}
            >
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4 text-white tracking-tight">{lesson.topic}</h1>

                    {lesson.concepts.map((concept, index) => (
                        <div key={concept.id} className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
                            <h3 className="text-2xl font-semibold mb-4 text-blue-400">{index + 1}. {concept.term}</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className="flex items-center font-bold text-gray-400 uppercase tracking-wider text-sm mb-2"><BookOpenIcon className="w-4 h-4 mr-2" />Definition</h4>
                                    <div onMouseUp={handleMouseUp(concept.id, 'definition')} className="prose prose-invert prose-sm max-w-none p-2 rounded-md select-text">
                                        <HighlightedContent text={concept.definition} conceptId={concept.id} fieldName="definition" annotations={lesson.annotations || []} onHighlightClick={handleHighlightClick} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="flex items-center font-bold text-gray-400 uppercase tracking-wider text-sm mb-2"><PencilIcon className="w-4 h-4 mr-2" />Notes & Edge Cases</h4>
                                    <div onMouseUp={handleMouseUp(concept.id, 'notes')} className="prose prose-invert prose-sm max-w-none p-2 rounded-md select-text">
                                         <HighlightedContent text={concept.notes} conceptId={concept.id} fieldName="notes" annotations={lesson.annotations || []} onHighlightClick={handleHighlightClick} />
                                    </div>
                                </div>
                                
                                {concept.visualExample && concept.visualExample.trim() !== '' && (
                                    <div>
                                        <h4 className="flex items-center font-bold text-gray-400 uppercase tracking-wider text-sm mb-2"><EyeIcon className="w-4 h-4 mr-2" />Visual Example</h4>
                                        <VisualExampleDisplay prompt={concept.visualExample} />
                                    </div>
                                )}

                                {concept.codeExample && concept.codeExample.trim() !== '' && (
                                    <div>
                                        <h4 className="flex items-center font-bold text-gray-400 uppercase tracking-wider text-sm mb-2"><CodeBracketIcon className="w-4 h-4 mr-2" />Code Example</h4>
                                        <CodeSnippet
                                            codeBlock={concept.codeExample}
                                            conceptId={concept.id}
                                            fieldName="codeExample"
                                            annotations={lesson.annotations || []}
                                            onHighlightClick={handleHighlightClick}
                                            onMouseUp={handleMouseUp(concept.id, 'codeExample')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            
            {popover && (
                <NotePopover 
                    annotation={popover.data}
                    onSave={handleSaveAnnotation}
                    onDelete={handleDeleteAnnotation}
                    onClose={() => setPopover(null)}
                    popoverStyle={popover.style}
                    isNew={popover.isNew}
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
