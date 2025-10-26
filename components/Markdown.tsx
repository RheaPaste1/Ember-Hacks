import React from 'react';

const parseInline = (text: string): React.ReactNode[] => {
    // This regex will split the string by markdown syntax, keeping the delimiters
    // It looks for **bold**, `code`.
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            // Keep specific syntax highlighting for inline code
            return <code key={i} className="bg-gray-200 dark:bg-black/20 text-fuchsia-700 dark:text-fuchsia-400 px-1.5 py-1 rounded-md font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
    }).filter(Boolean); // Filter out empty strings from split
};

const SyntaxHighlightedCode: React.FC<{ text: string }> = ({ text }) => {
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

export const Markdown: React.FC<{ content: string }> = ({ content }) => {
    // 1. Split by code blocks first to preserve them
    const blocks = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="break-words text-gray-900 dark:text-white">
            {blocks.map((block, index) => {
                if (!block || !block.trim()) return null;

                // 2. Render code blocks
                if (block.startsWith('```') && block.endsWith('```')) {
                    const codeBlockContent = block.slice(3, -3);
                    const langMatch = codeBlockContent.match(/^(.*?)\n/);
                    const lang = langMatch ? langMatch[1].trim() : '';
                    const code = lang ? codeBlockContent.substring(langMatch[0].length) : codeBlockContent;
                    return (
                        <div key={index} className="bg-gray-100 dark:bg-gray-900/80 rounded-lg my-2 text-gray-900 dark:text-white overflow-hidden">
                            {lang && <div className="text-xs text-gray-600 dark:text-gray-400 px-4 py-2 bg-gray-200 dark:bg-gray-900/50">{lang}</div>}
                            <pre className="p-4 overflow-x-auto font-mono"><code><SyntaxHighlightedCode text={code} /></code></pre>
                        </div>
                    );
                }

                // 3. For other text, process paragraphs and lists
                const paragraphs = block.trim().split(/\n{2,}/);
                
                return paragraphs.map((p, pIndex) => {
                    const lines = p.split('\n');
                    const listItems: string[] = [];
                    const otherLines: string[] = [];

                    lines.forEach(line => {
                        const listItemMatch = line.match(/^\s*[-*]\s(.*)/);
                        if (listItemMatch) {
                            listItems.push(listItemMatch[1]);
                        } else {
                            otherLines.push(line);
                        }
                    });

                    const elements = [];
                    if (otherLines.length > 0) {
                        elements.push(
                            <p key={`p-${index}-${pIndex}`}>{parseInline(otherLines.join(' '))}</p>
                        );
                    }
                    if (listItems.length > 0) {
                        elements.push(
                            <ul key={`ul-${index}-${pIndex}`} className="list-disc pl-6 my-2 space-y-1">
                                {listItems.map((item, i) => (
                                    <li key={i}>{parseInline(item)}</li>
                                ))}
                            </ul>
                        );
                    }
                    
                    return elements.length > 0 ? <div key={pIndex} className="my-2">{elements}</div> : null;
                });
            })}
        </div>
    );
};