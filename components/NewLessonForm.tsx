import React, { useState, useEffect } from 'react';
import { generateLesson } from '../services/geminiService';
import { Lesson, Concept, Folder } from '../types';
import { SpinnerIcon, PlusIcon, CodeIcon, ImageIcon, TextFileIcon, XIcon } from './Icons';

interface NewLessonFormProps {
  folders: Folder[];
  onLessonCreated: (lesson: Lesson, folderId: string) => void;
}

const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
        return <ImageIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />;
    }
    if (/\.(java|py|js|ts|c|cpp|cs|html|css|json)$/i.test(file.name)) {
        return <CodeIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    }
    return <TextFileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />;
}

export const NewLessonForm: React.FC<NewLessonFormProps> = ({ folders, onLessonCreated }) => {
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [lessonNotes, setLessonNotes] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // Key to reset file input

  useEffect(() => {
    if (folders.length > 0) {
        setSelectedFolderId(folders[0].id);
    }
  }, [folders]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
      // Reset the input by changing its key, forcing a re-mount.
      // This is a more robust React-idiomatic way than setting event.target.value = ''.
      setFileInputKey(Date.now());
    }
  };
  
  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topic || files.length === 0) {
      setError('Please provide a topic and at least one file.');
      return;
    }
    if (!selectedFolderId) {
        setError('Please select a folder.');
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const concepts = await generateLesson(topic, files, lessonNotes);
      const newLesson: Lesson = {
        id: self.crypto.randomUUID(),
        topic,
        concepts,
        annotations: [],
      };
      onLessonCreated(newLesson, selectedFolderId);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-transparent overflow-y-auto">
        <div className="flex justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-2xl p-8 space-y-8 bg-gray-800/50 backdrop-blur-2xl border border-gray-600/50 rounded-2xl shadow-2xl shadow-purple-500/10">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white">Create a New Lesson</h1>
                    <p className="mt-2 text-gray-400">Upload your code files and let AI build your learning guide.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Lesson Topic</label>
                        <input
                            id="topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., 'UML Diagrams and Java Inheritance'"
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="folder" className="block text-sm font-medium text-gray-300 mb-2">Save to Folder</label>
                        <select
                            id="folder"
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={folders.length === 0}
                        >
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">Lesson Instructions (Optional)</label>
                        <textarea
                            id="notes"
                            value={lessonNotes}
                            onChange={(e) => setLessonNotes(e.target.value)}
                            placeholder="e.g., 'Focus on beginner-friendly explanations. Compare the Java code to Python equivalents.'"
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Upload Files</label>
                        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none">
                                        <span>Upload files</span>
                                        <input key={fileInputKey} id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">.java, .py, .js, .png, .jpg, etc.</p>
                            </div>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-300">Selected files:</h3>
                            <ul className="mt-2 space-y-2 text-sm text-gray-400 max-h-40 overflow-y-auto border border-gray-700 rounded p-3 bg-gray-900">
                                {files.map((file, i) => (
                                    <li key={`${file.name}-${i}`} className="flex items-center justify-between space-x-2">
                                        <div className="flex items-center space-x-2 truncate">
                                            {getFileIcon(file)}
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(i)}
                                            className="p-1 text-gray-400 hover:text-red-400 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Generating Lesson...' : 'Create Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};