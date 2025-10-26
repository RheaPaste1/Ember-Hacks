import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Concept, Annotation } from '../types';
import { Chatbot } from './Chatbot';
import { VisualExampleDisplay } from './VisualExampleDisplay';
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon, BookOpenIcon, PencilIcon, EyeIcon, CodeBracketIcon, ClipboardIcon, CheckIcon, DownloadIcon, SpinnerIcon, SpeakerWaveIcon, StopIcon } from './Icons';
import { jsPDF } from 'jspdf';
import { generateSpeech } from '../services/geminiService';
import HighlightedContent from './HighlightedContent'; // Import the default export
import CodeSnippet from './CodeSnippet'; // Import CodeSnippet from its dedicated file


// Type declaration for the globally available jsPDF library
declare global {
    interface Window {
        jspdf: {
            jsPDF: typeof jsPDF;
        };
        webkitAudioContext: typeof AudioContext
    }
}

const generateLessonPdf = async (lesson: Lesson, generatedImages: Record<string, string>) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    let y = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = doc.internal.pageSize.width - margin * 2;

    const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(lesson.topic, contentWidth);
    checkPageBreak(titleLines.length * 10);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 10 + 10;

    for (const [index, concept] of lesson.concepts.entries()) {
        checkPageBreak(20);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`${index + 1}. ${concept.term}`, margin, y);
        y += 10;
        doc.setTextColor(0, 0, 0);

        if (concept.definition) {
            checkPageBreak(10);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Definition', margin, y);
            y += 7;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(concept.definition, contentWidth);
            checkPageBreak(lines.length * 5);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 10;
        }

        if (concept.notes) {
            checkPageBreak(10);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Notes & Edge Cases', margin, y);
            y += 7;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(concept.notes, contentWidth);
            checkPageBreak(lines.length * 5);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 10;
        }

        if (concept.codeExample) {
            checkPageBreak(10);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Code Example', margin, y);
            y += 7;
            const code = concept.codeExample.replace(/^```(?:\w*\n)?/, '').replace(/```$/, '').trim();
            const lines = doc.splitTextToSize(code, contentWidth - 10);
            const rectHeight = lines.length * 4 + 6;
            checkPageBreak(rectHeight + 5);
            doc.setFillColor(243, 244, 246);
            doc.rect(margin, y - 4, contentWidth, rectHeight, 'F');
            doc.setFont('courier', 'normal');
            doc.setFontSize(10);
            doc.text(lines, margin + 5, y);
            y += rectHeight + 5;
        }

        const imageUrl = generatedImages[concept.id];
        if (imageUrl) {
            checkPageBreak(10);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Visual Example', margin, y);
            y += 7;
            try {
                const imgProps = doc.getImageProperties(imageUrl);
                const aspectRatio = imgProps.width / imgProps.height;
                let imgWidth = contentWidth;
                let imgHeight = imgWidth / aspectRatio;
                const maxHeight = 120;
                if (imgHeight > maxHeight) {
                    imgHeight = maxHeight;
                    imgWidth = imgHeight * aspectRatio;
                }
                checkPageBreak(imgHeight + 5);
                doc.addImage(imageUrl, 'PNG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 10;
            } catch (e) {
                console.error("Error adding image to PDF:", e);
                doc.setFont('helvetica', 'italic').setFontSize(10).text('Error: Could not embed visual example.', margin, y);
                y += 10;
            }
        }
        y += 10;
    }

    doc.save(`${lesson.topic.replace(/\s/g, '_')}.pdf`);
};

// Audio decoding functions based on Gemini documentation
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


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

// Removed HighlightedContent from here as it's now imported as default export
// and CodeSnippet is still in the same file to keep it encapsulated for now.

// Removed local declaration of CodeSnippet and its SyntaxHighlightedText helper.
// It is now imported from './CodeSnippet'.


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
        <div ref={popoverRef} style={popoverStyle} className="fixed z-20 w-80 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-2xl p-4 flex flex-col popover-active dark:bg-gray-800 dark:text-white dark:border-gray-700">
            <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Note for: <span className="font-normal italic text-blue-600 dark:text-yellow-400">"{annotation.targetText}"</span></h5>
            <textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                className="w-full h-32 bg-gray-100 border border-gray-300 text-gray-900 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                aria-label="Annotation note"
            />
            <div className="mt-3 flex justify-between items-center">
                <button onClick={() => onDelete()} className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" aria-label="Delete note">
                    <TrashIcon className="w-5 h-5"/>
                </button>
                <div className="space-x-2">
                    <button onClick={onClose} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white">Cancel</button>
                    <button onClick={() => onSave(noteText)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Save</button>
                </div>
            </div>
        </div>
    );
};

interface LessonViewProps {
    lesson: Lesson;
    onUpdateLesson: (updatedLesson: Lesson) => void;
    selectedFontFamily: string; // Add selectedFontFamily prop
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

export const LessonView: React.FC<LessonViewProps> = ({ lesson, onUpdateLesson, selectedFontFamily }) => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(true);
    const [popover, setPopover] = useState<{ data: Annotation, style: React.CSSProperties, isNew: boolean } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(lesson.topic);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [audioState, setAudioState] = useState<{ id: string, status: 'loading' | 'playing' }>({ id: '', status: 'loading' });

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            currentAudioSourceRef.current?.stop(); // Stop any playing audio on unmount
            audioContextRef.current?.close();
        }
    }, []);

    useEffect(() => {
        setTitle(lesson.topic);
    }, [lesson.topic]);

    const handleTitleSave = () => {
        const trimmedTitle = title.trim();
        if (trimmedTitle && trimmedTitle !== lesson.topic) {
            onUpdateLesson({ ...lesson, topic: trimmedTitle });
        } else {
            setTitle(lesson.topic);
        }
        setIsEditingTitle(false);
    };

    const playAudio = async (text: string, id: string) => {
        if (currentAudioSourceRef.current) {
            currentAudioSourceRef.current.stop();
            currentAudioSourceRef.current = null;
            // If the same audio is clicked again, stop it and reset state
            if (audioState.id === id && audioState.status === 'playing') {
                setAudioState({ id: '', status: 'loading' });
                return;
            }
        }
        
        setAudioState({ id, status: 'loading' });

        try {
            const base64Audio = await generateSpeech(text);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current!, 24000, 1);

            const source = audioContextRef.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current!.destination);
            source.start();

            currentAudioSourceRef.current = source;
            setAudioState({ id, status: 'playing' });

            source.onended = () => {
                setAudioState({ id: '', status: 'loading' }); // Reset when audio finishes
                currentAudioSourceRef.current = null;
            };

        } catch (error) {
            console.error("Error playing audio:", error);
            setAudioState({ id: '', status: 'loading' });
            alert("Sorry, there was an error generating the audio.");
        }
    };

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

    const handleImageLoaded = (conceptId: string, url: string) => {
        setGeneratedImages(prev => ({ ...prev, [conceptId]: url }));
    };

    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            await generateLessonPdf(lesson, generatedImages);
        } catch (error) {
            console.error("Failed to generate PDF", error);
            alert("Sorry, there was an error creating the PDF.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };
    
    return (
        <div className="flex h-full overflow-hidden">
            <main 
                ref={contentRef} 
                className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900/50" 
                onMouseUp={(e) => { 
                    const selection = window.getSelection();
                    if (selection?.toString().length === 0 && popover && !(e.target as HTMLElement).closest('.popover-active')) {
                        setPopover(null);
                    }
                }}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 group mb-4">
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleTitleSave();
                                    if (e.key === 'Escape') {
                                        setIsEditingTitle(false);
                                        setTitle(lesson.topic);
                                    }
                                }}
                                className="text-4xl font-bold tracking-tight bg-gray-100 text-gray-900 focus:outline-none w-full rounded-md px-2 py-1 dark:bg-gray-700/50 dark:text-white"
                                autoFocus
                            />
                        ) : (
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{lesson.topic}</h1>
                        )}
                        {!isEditingTitle && (
                            <>
                                <button
                                    onClick={() => setIsEditingTitle(true)}
                                    className="p-2 text-gray-600 hover:text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-400 dark:hover:text-white"
                                    aria-label="Edit lesson title"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={isDownloadingPdf}
                                    className="p-2 text-gray-600 hover:text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-white"
                                    aria-label="Download lesson as PDF"
                                >
                                    {isDownloadingPdf ? <SpinnerIcon className="w-5 h-5 text-gray-600 dark:text-gray-500"/> : <DownloadIcon className="w-5 h-5" />}
                                </button>
                            </>
                        )}
                    </div>

                    {lesson.concepts.map((concept, index) => {
                        const definitionId = `${concept.id}-definition`;
                        const notesId = `${concept.id}-notes`;
                        const codeExampleId = `${concept.id}-codeExample`; // New ID for code examples
                        return (
                             <div key={concept.id} className="mb-8 p-px rounded-xl bg-gradient-to-br from-blue-500/50 via-transparent to-purple-500/50">
                                <div className="p-6 bg-white text-gray-900 rounded-[11px] shadow-lg dark:bg-gray-800 dark:text-white">
                                    <h3 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400">{index + 1}. {concept.term}</h3>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h4 className="flex items-center font-bold text-gray-600 uppercase tracking-wider text-sm mb-2 dark:text-gray-400"><BookOpenIcon className="w-4 h-4 mr-2" />Definition</h4>
                                                {concept.definition && (
                                                    <button onClick={() => playAudio(concept.definition, definitionId)} className="text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-white" title="Read definition aloud">
                                                        {audioState.id === definitionId && audioState.status === 'loading' && <SpinnerIcon className="w-4 h-4 text-gray-600 dark:text-gray-500" />}
                                                        {audioState.id === definitionId && audioState.status === 'playing' && <StopIcon className="w-4 h-4" />}
                                                        {audioState.id !== definitionId && <SpeakerWaveIcon className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                            {/* Removed prose classes that were overriding global font settings */}
                                            <div className="max-w-none p-0 rounded-md select-text my-2"> 
                                                <HighlightedContent 
                                                    text={concept.definition} 
                                                    conceptId={concept.id} 
                                                    fieldName="definition" 
                                                    annotations={lesson.annotations || []} 
                                                    onHighlightClick={handleHighlightClick} 
                                                    onMouseUp={handleMouseUp(concept.id, 'definition')}
                                                    isSpeaking={audioState.id === definitionId && audioState.status === 'playing'}
                                                    selectedFontFamily={selectedFontFamily}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h4 className="flex items-center font-bold text-gray-600 uppercase tracking-wider text-sm mb-2 dark:text-gray-400"><PencilIcon className="w-4 h-4 mr-2" />Notes & Edge Cases</h4>
                                                {concept.notes && (
                                                    <button onClick={() => playAudio(concept.notes, notesId)} className="text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-white" title="Read notes aloud">
                                                        {audioState.id === notesId && audioState.status === 'loading' && <SpinnerIcon className="w-4 h-4 text-gray-600 dark:text-gray-500" />}
                                                        {audioState.id === notesId && audioState.status === 'playing' && <StopIcon className="w-4 h-4" />}
                                                        {audioState.id !== notesId && <SpeakerWaveIcon className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                            {/* Removed prose classes that were overriding global font settings */}
                                            <div className="max-w-none p-0 rounded-md select-text my-2">
                                                 <HighlightedContent 
                                                    text={concept.notes} 
                                                    conceptId={concept.id} 
                                                    fieldName="notes" 
                                                    annotations={lesson.annotations || []} 
                                                    onHighlightClick={handleHighlightClick} 
                                                    onMouseUp={handleMouseUp(concept.id, 'notes')}
                                                    isSpeaking={audioState.id === notesId && audioState.status === 'playing'}
                                                    selectedFontFamily={selectedFontFamily}
                                                 />
                                            </div>
                                        </div>
                                        
                                        {concept.visualExample && concept.visualExample.trim() !== '' && (
                                            <div>
                                                <h4 className="flex items-center font-bold text-gray-600 uppercase tracking-wider text-sm mb-2 dark:text-gray-400"><EyeIcon className="w-4 h-4 mr-2" />Visual Example</h4>
                                                <VisualExampleDisplay 
                                                    prompt={concept.visualExample} 
                                                    onImageLoaded={(url) => handleImageLoaded(concept.id, url)}
                                                />
                                            </div>
                                        )}

                                        {concept.codeExample && concept.codeExample.trim() !== '' && (
                                            <div>
                                                <h4 className="flex items-center font-bold text-gray-600 uppercase tracking-wider text-sm mb-2 dark:text-gray-400"><CodeBracketIcon className="w-4 h-4 mr-2" />Code Example</h4>
                                                <button onClick={() => playAudio(concept.codeExample, codeExampleId)} className="text-gray-600 hover:text-gray-900 transition-colors ml-auto mb-2 block dark:text-gray-400 dark:hover:text-white" title="Read code example aloud">
                                                    {audioState.id === codeExampleId && audioState.status === 'loading' && <SpinnerIcon className="w-4 h-4 text-gray-600 dark:text-gray-500" />}
                                                    {audioState.id === codeExampleId && audioState.status === 'playing' && <StopIcon className="w-4 h-4" />}
                                                    {audioState.id !== codeExampleId && <SpeakerWaveIcon className="w-4 h-4" />}
                                                </button>
                                                <CodeSnippet
                                                    codeBlock={concept.codeExample}
                                                    conceptId={concept.id}
                                                    fieldName="codeExample"
                                                    annotations={lesson.annotations || []}
                                                    onHighlightClick={handleHighlightClick}
                                                    onMouseUp={handleMouseUp(concept.id, 'codeExample')}
                                                    isSpeaking={audioState.id === codeExampleId && audioState.status === 'playing'}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
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
                 <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm border-l border-gray-300 dark:border-gray-700/50">
                    <button 
                        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                        className="h-full px-2 py-4 flex flex-col items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50 focus:outline-none w-10"
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