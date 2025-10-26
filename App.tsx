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

    // Font accessibility states
    const [selectedFontSize, setSelectedFontSize] = useState<number>(() => {
        try {
            const savedFontSize = localStorage.getItem('cs-lesson-architect-font-size');
            return savedFontSize ? parseInt(savedFontSize, 10) : 16; // Default to 16px
        } catch (error) {
            console.error("Failed to parse font size from localStorage", error);
            return 16;
        }
    });
    const [selectedFontFamily, setSelectedFontFamily] = useState<string>(() => {
        try {
            const savedFontFamily = localStorage.getItem('cs-lesson-architect-font-family');
            return savedFontFamily || 'sans-serif'; // Default to sans-serif
        } catch (error) {
            console.error("Failed to parse font family from localStorage", error);
            return 'sans-serif';
        }
    });

    // Theme state
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system' | 'accessibility' | 'dark-high-contrast'>(() => {
        try {
            const savedTheme = localStorage.getItem('cs-lesson-architect-theme');
            return (savedTheme as 'light' | 'dark' | 'system' | 'accessibility' | 'dark-high-contrast') || 'system';
        } catch (error) {
            console.error("Failed to parse theme from localStorage", error);
            return 'system';
        }
    });

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

    // Persist folders
    useEffect(() => {
        localStorage.setItem('cs-lesson-architect-folders', JSON.stringify(folders));
    }, [folders]);

    // Persist font size and apply to HTML root
    useEffect(() => {
        localStorage.setItem('cs-lesson-architect-font-size', selectedFontSize.toString());
        // Set font-size on the root html element for global scaling of rem units
        document.documentElement.style.fontSize = `${selectedFontSize / 16}rem`;
    }, [selectedFontSize]);

    // Persist font family
    useEffect(() => {
        localStorage.setItem('cs-lesson-architect-font-family', selectedFontFamily);
    }, [selectedFontFamily]);

    // Effect for applying theme
    useEffect(() => {
        const htmlElement = document.documentElement;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Cleanup function for the media query listener, declared here to be accessible.
        let systemThemeCleanup: (() => void) | undefined;

        // Remove any existing theme classes
        htmlElement.classList.remove('dark', 'theme-accessibility', 'theme-dark-high-contrast');

        // Apply the chosen theme
        switch (selectedTheme) {
            case 'dark':
                htmlElement.classList.add('dark');
                break;
            case 'light':
                // No specific class needed for light theme
                break;
            case 'system':
                const applySystemTheme = () => {
                    if (prefersDark.matches) {
                        htmlElement.classList.add('dark');
                        htmlElement.classList.remove('theme-accessibility', 'theme-dark-high-contrast'); // Ensure only dark for system dark
                    } else {
                        htmlElement.classList.remove('dark', 'theme-accessibility', 'theme-dark-high-contrast'); // Ensure clean for system light
                    }
                };
                applySystemTheme(); // Apply initial system theme
                prefersDark.addEventListener('change', applySystemTheme);
                systemThemeCleanup = () => prefersDark.removeEventListener('change', applySystemTheme);
                break;
            case 'accessibility':
                htmlElement.classList.add('theme-accessibility');
                break;
            case 'dark-high-contrast':
                htmlElement.classList.add('theme-dark-high-contrast');
                break;
        }

        // Persist theme to localStorage
        localStorage.setItem('cs-lesson-architect-theme', selectedTheme);

        // Console log for debugging
        console.log('Applied theme:', selectedTheme, 'HTML classes:', htmlElement.classList.value);

        // Return cleanup function for the effect
        return () => {
            if (systemThemeCleanup) {
                systemThemeCleanup(); // Only cleanup the system theme listener if it was set
            }
        };
    }, [selectedTheme]); // Dependency array ensures effect re-runs when selectedTheme changes


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
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-900 dark:bg-[#1A1A1A] dark:text-white p-4">
                <div className="w-full max-w-lg text-center p-8 bg-white dark:bg-gray-900 backdrop-blur-2xl border border-gray-300 dark:border-gray-600/50 rounded-2xl shadow-2xl shadow-blue-500/10">
                    <LogoIcon className="w-24 h-24 text-blue-600 dark:text-blue-500 mb-6 mx-auto" />
                    <h1 className="text-5xl font-bold mb-4">CS Lesson Architect</h1>
                    <p className="text-xl text-gray-700 dark:text-gray-400 mb-8">Your AI-powered study partner.</p>
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

    // Dynamically apply font family class
    const fontFamilyClass = selectedFontFamily === 'serif' ? 'font-serif' : (selectedFontFamily === 'monospace' ? 'font-mono' : ''); // Removed 'font-sans' default here

    return (
        <div className={`flex h-screen bg-transparent text-gray-900 dark:text-white ${fontFamilyClass}`}>
            <Sidebar
                folders={folders}
                selectedLessonId={selectedLessonId}
                onSelectLesson={handleSelectLesson}
                onNewLesson={handleNewLesson}
                onAddFolder={handleAddFolder}
                onRenameFolder={handleRenameFolder}
                onMoveLesson={handleMoveLesson}
                // Pass font accessibility props
                selectedFontSize={selectedFontSize}
                setSelectedFontSize={setSelectedFontSize}
                selectedFontFamily={selectedFontFamily}
                setSelectedFontFamily={setSelectedFontFamily}
                // Pass theme accessibility props
                selectedTheme={selectedTheme}
                setSelectedTheme={setSelectedTheme}
            />
            <div className="flex-1 overflow-hidden">
                {currentView === 'new-lesson' && <NewLessonForm folders={folders} onLessonCreated={handleLessonCreated} />}
                {currentView === 'lesson-view' && selectedLesson && (
                    <LessonView lesson={selectedLesson} onUpdateLesson={handleUpdateLesson} selectedFontFamily={selectedFontFamily} />
                )}
                {currentView === 'lesson-view' && !selectedLesson && (
                    <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-500">
                        <p>Select a lesson to view or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;