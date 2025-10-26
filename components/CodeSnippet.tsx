import React, { useState } from 'react';
import { Annotation } from '../types';
import { ClipboardIcon, CheckIcon } from './Icons';

const CodeSnippet: React.FC<{
    codeBlock: string;
    conceptId: string;
    fieldName: 'codeExample';
    annotations: Annotation[];
    onHighlightClick: (annotation: Annotation, target: HTMLElement) => void;
    onMouseUp: (e: React.MouseEvent<HTMLElement>) => void;
    isSpeaking: boolean;
}> = ({ codeBlock, conceptId, fieldName, annotations, onHighlightClick, onMouseUp, isSpeaking }) => {
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
            { type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/, className: 'text-gray-500 italic dark:text-gray-400' }, // Adjusted light, kept dark
            { type: 'string', regex: /(".*?"|'.*?'|`.*?`)/, className: 'text-yellow-700 dark:text-yellow-300' }, // Adjusted light
            { type: 'keyword', regex: /\b(public|private|protected|static|final|void|class|interface|enum|extends|implements|new|import|package|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|const|let|var|function|async|await|export|default|int|boolean|double|float|true|false|null|this|from|of|in|type|instanceof|delete|yield)\b/, className: 'text-fuchsia-700 dark:text-fuchsia-400' }, // Adjusted light
            { type: 'number', regex: /\b(\d+\.?\d*)\b/, className: 'text-orange-600 dark:text-orange-400' }, // Adjusted light
            { type: 'function', regex: /(\w+)(?=\s*\()/, className: 'text-cyan-700 dark:text-cyan-400' }, // Adjusted light
            { type: 'className', regex: /\b([A-Z][a-zA-Z0-9_]*)\b/, className: 'text-sky-700 dark:text-sky-400' }, // Adjusted light
            { type: 'operator', regex: /([=+\-*/%&|<>!^~?:.]+)/, className: 'text-fuchsia-700 dark:text-fuchsia-400' }, // Adjusted light
            { type: 'punctuation', regex: /([{}()\[\].,;])/, className: 'text-gray-600 dark:text-gray-300' }, // Adjusted light
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
                    <span key={`text-${lastIndex}`} className="text-gray-800 dark:text-slate-300"> {/* Adjusted light */}
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
                            className = 'text-sky-700 dark:text-sky-400'; // Adjusted light
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
                    <span key={`text-${lastIndex}`} className="text-gray-800 dark:text-slate-300"> {/* Adjusted light */}
                        {match[0]}
                    </span>
                );
            }
    
            lastIndex = masterRegex.lastIndex;
        }
        
        // Remaining text
        if (lastIndex < text.length) {
            finalElements.push(
                <span key={`text-${lastIndex}`} className="text-gray-800 dark:text-slate-300"> {/* Adjusted light */}
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
        <div className="bg-gray-100 rounded-md overflow-hidden mt-2 border border-gray-300 dark:bg-gray-900 dark:border-gray-700/50">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-200 dark:bg-gray-800/50">
                <span className="text-xs font-sans text-gray-600 uppercase dark:text-gray-400">{language}</span>
                <button onClick={handleCopy} className="text-xs flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors duration-200 dark:text-gray-400 dark:hover:text-white">
                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400"/> : <ClipboardIcon className="w-4 h-4"/>}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre onMouseUp={onMouseUp} className={`p-4 font-mono whitespace-pre-wrap break-words select-text overflow-x-auto rounded-b-md transition-all duration-300 ease-in-out ${isSpeaking ? 'bg-blue-200/50 border-l-4 border-blue-500 dark:bg-blue-900/20' : ''}`}> {/* Adjusted bg-blue-100/50 to bg-blue-200/50 */}
                <code>
                    {renderContentWithHighlights()}
                </code>
            </pre>
        </div>
    );
};

export default CodeSnippet;