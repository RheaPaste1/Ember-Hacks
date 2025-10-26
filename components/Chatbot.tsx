import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Lesson } from '../types';
import { chatWithBot } from '../services/geminiService';
import { SendIcon, SpinnerIcon, UserIcon, SparklesIcon } from './Icons';
import { Markdown } from './Markdown';

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
    <div className="chatbot-wrapper flex flex-col h-full bg-gray-100 text-gray-900 dark:bg-[#212121] dark:text-gray-200 backdrop-blur-lg border-l border-gray-300 dark:border-[#4A4A4A] w-[400px]">
      <div className="p-4 border-b border-gray-300 dark:border-[#4A4A4A]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lesson Assistant</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
             {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333333] flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-[#60A5FA]" />
                </div>
             )}
            <div className={`rounded-lg px-4 py-2 max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900 dark:bg-[#282828] dark:text-gray-200'}`}>
                {msg.role === 'model' ? 
                  <Markdown content={msg.content} /> : 
                  <pre className="whitespace-pre-wrap break-words">{msg.content}</pre>
                }
            </div>
             {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-white" />
                </div>
             )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <div className="flex justify-start items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333333] flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-[#60A5FA]" />
                </div>
                <div className="bg-gray-200 text-gray-900 dark:bg-[#282828] dark:text-gray-200 rounded-lg px-4 py-2">
                    <SpinnerIcon className="w-5 h-5 text-gray-600 dark:text-[#A0A0A0]" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-300 dark:border-[#4A4A4A]">
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
            className="flex-1 bg-white text-gray-900 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none border border-gray-300 dark:bg-[#333333] dark:text-gray-200 dark:border-[#4A4A4A]"
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