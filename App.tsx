
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NewLessonForm } from './components/NewLessonForm';
import { LessonView } from './components/LessonView';
import { Folder, Lesson } from './types';
import { LogoIcon } from './components/Icons';

const App: React.FC = () => {
    const [folders, setFolders] = useState<Folder[]>(() => {
        try {
            const savedFolders = localStorage.getItem('cs-lesson-architect-folders');
            return savedFolders ? JSON.parse(savedFolders) : [{ id: 'default', name: 'My Lessons', lessons: [] }];
        } catch (error) {
            console.error("Failed to parse folders from localStorage", error);
            return [{ id: 'default', name: 'My Lessons', lessons: [] }];
        }
    });

    const [isAuthenticated, setIsAuthenticated] = useState(false); // Mock authentication
    const [currentView, setCurrentView] = useState<'new-lesson' | 'lesson-view'>('new-lesson');
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('cs-lesson-architect-folders', JSON.stringify(folders));
    }, [folders]);

    const handleNewLesson = () => {
        setCurrentView('new-lesson');
        setSelectedLessonId(null);
        setSelectedFolderId(null);
    };

    const handleSelectLesson = (folderId: string, lessonId: string) => {
        setSelectedFolderId(folderId);
        setSelectedLessonId(lessonId);
        setCurrentView('lesson-view');
    };

    const handleLessonCreated = (lesson: Lesson) => {
        const defaultFolder = folders.find(f => f.id === 'default') || folders[0];
        if (!defaultFolder) {
            const newFolder = { id: 'default', name: 'My Lessons', lessons: [lesson] };
            setFolders([newFolder]);
        } else {
            setFolders(folders.map(f => 
                f.id === defaultFolder.id 
                    ? { ...f, lessons: [...f.lessons, lesson] } 
                    : f
            ));
        }
        handleSelectLesson(defaultFolder.id, lesson.id);
    };

    const handleAddFolder = (name: string) => {
        const newFolder: Folder = {
            id: self.crypto.randomUUID(),
            name,
            lessons: []
        };
        setFolders([...folders, newFolder]);
    };

    const handleUpdateLesson = (updatedLesson: Lesson) => {
        setFolders(folders.map(folder => ({
            ...folder,
            lessons: folder.lessons.map(lesson => 
                lesson.id === updatedLesson.id ? updatedLesson : lesson
            )
        })));
    };

    const getSelectedLesson = (): Lesson | null => {
        if (!selectedFolderId || !selectedLessonId) return null;
        const folder = folders.find(f => f.id === selectedFolderId);
        return folder?.lessons.find(l => l.id === selectedLessonId) || null;
    };
    
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <LogoIcon className="w-24 h-24 text-blue-500 mb-6" />
                <h1 className="text-5xl font-bold mb-4">CS Lesson Architect</h1>
                <p className="text-xl text-gray-400 mb-8">Your AI-powered study partner.</p>
                <button 
                    onClick={() => setIsAuthenticated(true)}
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                >
                    Enter Application
                </button>
                <p className="mt-4 text-xs text-gray-500">(This is a mock authentication for demonstration)</p>
            </div>
        )
    }

    const selectedLesson = getSelectedLesson();

    return (
        <div className="flex h-screen font-sans">
            <Sidebar
                folders={folders}
                selectedLessonId={selectedLessonId}
                onSelectLesson={handleSelectLesson}
                onNewLesson={handleNewLesson}
                onAddFolder={handleAddFolder}
            />
            <div className="flex-1 bg-gray-900 overflow-hidden">
                {currentView === 'new-lesson' && <NewLessonForm onLessonCreated={handleLessonCreated} />}
                {currentView === 'lesson-view' && selectedLesson && (
                    <LessonView lesson={selectedLesson} onUpdateLesson={handleUpdateLesson} />
                )}
                {currentView === 'lesson-view' && !selectedLesson && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a lesson to view or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;