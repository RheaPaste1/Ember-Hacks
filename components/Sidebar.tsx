

import React, { useState } from 'react';
import { Folder, Lesson } from '../types';
import { FolderIcon, FileIcon, PlusIcon, PencilIcon } from './Icons';

interface SidebarProps {
  folders: Folder[];
  selectedLessonId: string | null;
  onSelectLesson: (folderId: string, lessonId: string) => void;
  onNewLesson: () => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onMoveLesson: (lessonId: string, sourceFolderId: string, destinationFolderId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ folders, selectedLessonId, onSelectLesson, onNewLesson, onAddFolder, onRenameFolder, onMoveLesson }) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [draggedOverFolderId, setDraggedOverFolderId] = useState<string | null>(null);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowInput(false);
    }
  };

  const handleStartEdit = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveEdit = () => {
      if (editingFolderId && editingFolderName.trim()) {
          onRenameFolder(editingFolderId, editingFolderName.trim());
      }
      setEditingFolderId(null);
  };

  return (
    <aside className="w-72 bg-gray-800/80 backdrop-blur-lg text-gray-300 flex flex-col h-full border-r border-gray-700/50">
      <div className="p-4 border-b border-gray-700/50">
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
                    autoFocus
                    className="flex-1 bg-gray-700 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                    onBlur={() => setShowInput(false)}
                />
                <button onClick={handleAddFolder} className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700">Add</button>
            </div>
        )}

        {folders.map(folder => (
          <div 
            key={folder.id}
            onDragOver={(e) => { e.preventDefault(); setDraggedOverFolderId(folder.id); }}
            onDragEnter={() => setDraggedOverFolderId(folder.id)}
            onDragLeave={() => setDraggedOverFolderId(null)}
            onDrop={(e) => {
                e.preventDefault();
                setDraggedOverFolderId(null);
                const lessonId = e.dataTransfer.getData('lessonId');
                const sourceFolderId = e.dataTransfer.getData('sourceFolderId');
                if (lessonId && sourceFolderId) {
                    onMoveLesson(lessonId, sourceFolderId, folder.id);
                }
            }}
            className={`rounded-md transition-colors ${draggedOverFolderId === folder.id ? 'bg-gray-700' : ''}`}
          >
            <div className="flex items-center space-x-2 text-gray-400 p-1 group">
              <FolderIcon className="w-5 h-5 flex-shrink-0" />
              {editingFolderId === folder.id ? (
                <input
                    type="text"
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                    className="flex-1 bg-gray-900 text-sm rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <>
                  <span className="font-semibold text-sm flex-1 truncate">{folder.name}</span>
                  <button onClick={() => handleStartEdit(folder)} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white rounded-full focus:opacity-100">
                      <PencilIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <ul className="mt-1 pl-4 border-l border-gray-700/50 space-y-1">
              {folder.lessons.map(lesson => (
                <li key={lesson.id}>
                  <a
                    href="#"
                    draggable="true"
                    onDragStart={(e) => {
                        e.dataTransfer.setData('lessonId', lesson.id);
                        e.dataTransfer.setData('sourceFolderId', folder.id);
                        e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectLesson(folder.id, lesson.id);
                    }}
                    className={`flex items-center space-x-3 pl-2 pr-1.5 py-1.5 rounded-md text-sm transition-all duration-200 ease-in-out ${
                      lesson.id === selectedLessonId
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'hover:bg-gray-700 hover:pl-3'
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