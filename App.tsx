
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
        const handleMouseMove = (e: MouseEvent) => {
            document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

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

    const handleLessonCreated = (lesson: Lesson, folderId: string) => {
        let targetFolderId = folderId;
        // Fallback if no folder is selected or found
        if (!folders.some(f => f.id === targetFolderId)) {
            targetFolderId = folders[0]?.id;
        }

        if (!targetFolderId) {
             // Create a default folder if none exist
             const newFolder = { id: 'default', name: 'My Lessons', lessons: [lesson] };
             setFolders([newFolder]);
             handleSelectLesson(newFolder.id, lesson.id);
             return;
        }

        setFolders(folders.map(f =>
            f.id === targetFolderId
                ? { ...f, lessons: [...f.lessons, lesson] }
                : f
        ));
        handleSelectLesson(targetFolderId, lesson.id);
    };

    const handleAddFolder = (name: string) => {
        const newFolder: Folder = {
            id: self.crypto.randomUUID(),
            name,
            lessons: []
        };
        setFolders([...folders, newFolder]);
    };

    const handleRenameFolder = (folderId: string, newName: string) => {
        setFolders(folders.map(f => f.id === folderId ? { ...f, name: newName } : f));
    };

    const handleMoveLesson = (lessonId: string, sourceFolderId: string, destinationFolderId: string) => {
        if (sourceFolderId === destinationFolderId) return;

        let lessonToMove: Lesson | undefined;
        const foldersWithoutLesson = folders.map(folder => {
            if (folder.id === sourceFolderId) {
                lessonToMove = folder.lessons.find(l => l.id === lessonId);
                return { ...folder, lessons: folder.lessons.filter(l => l.id !== lessonId) };
            }
            return folder;
        });

        if (lessonToMove) {
            const foldersWithLesson = foldersWithoutLesson.map(folder => {
                if (folder.id === destinationFolderId) {
                    return { ...folder, lessons: [...folder.lessons, lessonToMove!] };
                }
                return folder;
            });
            setFolders(foldersWithLesson);
        }
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
            <div className="flex flex-col items-center justify-center h-screen text-white p-4">
                <div className="w-full max-w-lg text-center p-8 bg-gray-800/50 backdrop-blur-2xl border border-gray-600/50 rounded-2xl shadow-2xl shadow-blue-500/10">
                    <LogoIcon className="w-24 h-24 text-blue-500 mb-6 mx-auto" />
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
                onRenameFolder={handleRenameFolder}
                onMoveLesson={handleMoveLesson}
            />
            <div className="flex-1 bg-gray-900/50 overflow-hidden">
                {currentView === 'new-lesson' && <NewLessonForm folders={folders} onLessonCreated={handleLessonCreated} />}
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