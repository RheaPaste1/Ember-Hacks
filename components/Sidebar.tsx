
import React, { useState } from 'react';
import { Folder, Lesson } from '../types';
import { FolderIcon, FileIcon, PlusIcon } from './Icons';

interface SidebarProps {
  folders: Folder[];
  selectedLessonId: string | null;
  onSelectLesson: (folderId: string, lessonId: string) => void;
  onNewLesson: () => void;
  onAddFolder: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ folders, selectedLessonId, onSelectLesson, onNewLesson, onAddFolder }) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowInput(false);
    }
  };

  return (
    <aside className="w-72 bg-gray-800 text-gray-300 flex flex-col h-full border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">CS Lesson Architect</h1>
      </div>
      <div className="p-4">
        <button
          onClick={onNewLesson}
          className="w-full flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Lesson
        </button>
      </div>
      <nav className="flex-1 px-4 pb-4 space-y-4 overflow-y-auto">
        <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase text-gray-500">Folders</h2>
            <button onClick={() => setShowInput(true)} className="p-1 text-gray-400 hover:text-white rounded-full">
                <PlusIcon className="w-4 h-4" />
            </button>
        </div>
        
        {showInput && (
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name"
                    className="flex-1 bg-gray-700 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                />
                <button onClick={handleAddFolder} className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700">Add</button>
            </div>
        )}

        {folders.map(folder => (
          <div key={folder.id}>
            <div className="flex items-center space-x-2 text-gray-400">
              <FolderIcon className="w-5 h-5" />
              <span className="font-semibold text-sm">{folder.name}</span>
            </div>
            <ul className="mt-2 pl-4 border-l border-gray-700 space-y-1">
              {folder.lessons.map(lesson => (
                <li key={lesson.id}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectLesson(folder.id, lesson.id);
                    }}
                    className={`flex items-center space-x-3 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      lesson.id === selectedLessonId
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <FileIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{lesson.topic}</span>
                  </a>
                </li>
              ))}
               {folder.lessons.length === 0 && (
                <li className="text-xs text-gray-500 pl-2 italic">No lessons yet</li>
               )}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};
