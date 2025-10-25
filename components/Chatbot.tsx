
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Lesson } from '../types';
import { chatWithBot } from '../services/geminiService';
import { SendIcon, SpinnerIcon } from './Icons';

interface ChatbotProps {
  lesson: Lesson;
  onUpdateLesson: (updatedLesson: Lesson) => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ lesson, onUpdateLesson }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const chatHistory = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));

        const stream = await chatWithBot(chatHistory, lesson, input);

        let modelResponse = '';
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = modelResponse;
                return newMessages;
            });
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-l border-gray-700 w-[400px]">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Lesson Assistant</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <pre className="text-sm font-sans whitespace-pre-wrap break-words">{msg.content}</pre>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg px-4 py-2">
                    <SpinnerIcon className="w-5 h-5" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question or give a command..."
            className="flex-1 bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <SendIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
