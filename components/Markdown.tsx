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
            return <code key={i} className="bg-black/20 text-fuchsia-400 px-1.5 py-1 rounded-md text-sm font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
    }).filter(Boolean); // Filter out empty strings from split
};

export const Markdown: React.FC<{ content: string }> = ({ content }) => {
    // 1. Split by code blocks first to preserve them
    const blocks = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="text-sm font-sans break-words text-white">
            {blocks.map((block, index) => {
                if (!block || !block.trim()) return null;

                // 2. Render code blocks
                if (block.startsWith('```') && block.endsWith('```')) {
                    const codeBlockContent = block.slice(3, -3);
                    const langMatch = codeBlockContent.match(/^(.*?)\n/);
                    const lang = langMatch ? langMatch[1].trim() : '';
                    const code = lang ? codeBlockContent.substring(langMatch[0].length) : codeBlockContent;
                    return (
                        <div key={index} className="bg-gray-900/80 rounded-lg my-2 text-white overflow-hidden">
                            {lang && <div className="text-xs text-gray-400 px-4 py-2 bg-gray-900/50">{lang}</div>}
                            <pre className="p-4 text-sm overflow-x-auto"><code>{code}</code></pre>
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
