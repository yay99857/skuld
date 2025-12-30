import React, { useState, useEffect, useRef } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Sidebar } from './Sidebar';
import { NoteList } from './NoteList';
import { EditorContainer, ViewMode } from '../editor/EditorContainer';
import { QuickOpen } from './QuickOpen';
import { CreateNoteModal } from './CreateNoteModal';
import { ConfirmationModal } from './ConfirmationModal';
import { useNotes } from './NoteContext';

export const Layout: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('editor');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { selectedNote, setIsQuickOpen, selectionFocus, setSelectionFocus, setVimMode } = useNotes();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const noteListRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // View Modes
            if (e.altKey && e.key === '1') setViewMode('editor');
            if (e.altKey && e.key === '2') setViewMode('both');
            if (e.altKey && e.key === '3') setViewMode('preview');

            // Sidebar Toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                setIsSidebarOpen(prev => !prev);
            }

            // Quick Open
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setIsQuickOpen(true);
            }

            // Toggle Preview (Editor/Both)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                setViewMode(prev => prev === 'editor' ? 'both' : 'editor');
            }

            // Tab Navigation
            if (e.key === 'Tab') {
                e.preventDefault();
                const currentArea = selectionFocus || 'notebooks';

                let nextArea: 'notebooks' | 'notes' | 'editor';
                if (e.shiftKey) {
                    // Shift + Tab (Reverse)
                    if (currentArea === 'notebooks' || currentArea === 'tags') nextArea = 'editor';
                    else if (currentArea === 'notes') nextArea = 'notebooks';
                    else nextArea = 'notes';
                } else {
                    // Tab (Forward)
                    if (currentArea === 'notebooks' || currentArea === 'tags') nextArea = 'notes';
                    else if (currentArea === 'notes') nextArea = 'editor';
                    else nextArea = 'notebooks';
                }

                if (nextArea === 'notebooks') {
                    setSelectionFocus('notebooks');
                    sidebarRef.current?.focus();
                } else if (nextArea === 'notes') {
                    setSelectionFocus('notes');
                    noteListRef.current?.focus();
                } else if (nextArea === 'editor') {
                    setSelectionFocus('editor');
                    editorRef.current?.focus();
                }
            }

            // Vim Toggle
            if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                setVimMode(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsQuickOpen, selectionFocus, setSelectionFocus]);

    useEffect(() => {
        if (!selectionFocus) return;

        const ref = (selectionFocus === 'notebooks' || selectionFocus === 'tags') ? sidebarRef :
            selectionFocus === 'notes' ? noteListRef :
                selectionFocus === 'editor' ? editorRef : null;

        if (ref?.current && !ref.current.contains(document.activeElement)) {
            ref.current.focus();
        }
    }, [selectionFocus]);

    return (
        <div className="h-screen w-full bg-[#1e1e1e] text-neutral-300 overflow-hidden font-sans relative">
            <PanelGroup orientation="horizontal" className="w-full h-full">
                {isSidebarOpen && (
                    <>
                        <Panel defaultSize="15" minSize="15" maxSize="30" className="flex flex-col h-full min-h-0">
                            <div
                                ref={sidebarRef}
                                className={`h-full focus:outline-none transition-colors duration-200 ${(selectionFocus === 'notebooks' || selectionFocus === 'tags') ? 'bg-[#121212]' : 'bg-[#181818]'}`}
                                tabIndex={-1}
                            >
                                <Sidebar />
                            </div>
                        </Panel>
                        <PanelResizeHandle className="w-1 bg-[#252525] hover:bg-purple-500 transition-colors flex items-center justify-center group">
                            <div className="w-[2px] h-8 rounded-full bg-neutral-700 group-hover:bg-white transition-colors" />
                        </PanelResizeHandle>
                    </>
                )}

                {viewMode !== 'both' && (
                    <>
                        <Panel defaultSize="25" minSize="20" maxSize="40" className="flex flex-col h-full min-h-0">
                            <div
                                ref={noteListRef}
                                className={`h-full focus:outline-none transition-colors duration-200 ${selectionFocus === 'notes' ? 'bg-[#121212]' : 'bg-[#1e1e1e]'}`}
                                tabIndex={-1}
                            >
                                <NoteList />
                            </div>
                        </Panel>
                        <PanelResizeHandle className="w-1 bg-[#252525] hover:bg-purple-500 transition-colors flex items-center justify-center group">
                            <div className="w-[2px] h-8 rounded-full bg-neutral-700 group-hover:bg-white transition-colors" />
                        </PanelResizeHandle>
                    </>
                )}

                <Panel minSize="30" className="flex flex-col h-full min-h-0">
                    <div
                        ref={editorRef}
                        className={`h-full focus:outline-none transition-colors duration-200 ${selectionFocus === 'editor' ? 'bg-[#0f0f0f]' : 'bg-[#1e1e1e]'}`}
                        tabIndex={-1}
                    >
                        <EditorContainer
                            key={selectedNote?.id || 'none'}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                        />
                    </div>
                </Panel>
            </PanelGroup>

            <QuickOpen />
            <CreateNoteModal />
            <ConfirmationModal />
        </div>
    );
};
