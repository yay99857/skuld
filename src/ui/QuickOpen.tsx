import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, FileText, Hash } from 'lucide-react';
import { useNotes } from './NoteContext';

export const QuickOpen: React.FC = () => {
    const { notes, isQuickOpen, setIsQuickOpen, selectNote, notebooks, setSelectionFocus } = useNotes();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    useEffect(() => {
        if (isQuickOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isQuickOpen]);

    useEffect(() => {
        if (filteredNotes.length > 0 && selectedIndex >= filteredNotes.length) {
            setSelectedIndex(filteredNotes.length - 1);
        }
    }, [filteredNotes, selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredNotes.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredNotes.length) % filteredNotes.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredNotes[selectedIndex]) {
                selectNote(filteredNotes[selectedIndex].id);
                setSelectionFocus('editor');
                setIsQuickOpen(false);
            }
        }
    };

    const getNotebookName = (notebookId: string | null) => {
        if (!notebookId) return 'Inbox';
        return notebooks.find(nb => nb.id === notebookId)?.name || 'Unknown';
    };

    return (
        <Dialog.Root open={isQuickOpen} onOpenChange={setIsQuickOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] animate-in fade-in duration-200" />
                <Dialog.Content
                    className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-[#252525] border border-neutral-700 rounded-xl shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200 flex flex-col"
                >
                    <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
                        <Search size={18} className="text-neutral-500" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search notes..."
                            className="bg-transparent border-none outline-none text-white w-full text-lg placeholder:text-neutral-600"
                        />
                    </div>

                    <div className="max-h-[350px] overflow-y-auto p-2">
                        {filteredNotes.length > 0 ? (
                            <div className="space-y-1">
                                {filteredNotes.map((note, index) => (
                                    <button
                                        key={note.id}
                                        onClick={() => {
                                            selectNote(note.id);
                                            setSelectionFocus('editor');
                                            setIsQuickOpen(false);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${index === selectedIndex ? 'bg-purple-600/20 text-white' : 'hover:bg-neutral-800/50 text-neutral-400'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-md ${index === selectedIndex ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-500'}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{note.title || 'Untitled Note'}</div>
                                            <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                                                <Hash size={12} />
                                                <span>{getNotebookName(note.notebookId)}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-neutral-500">
                                <Search size={24} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notes found matching your search</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-neutral-900/50 border-t border-neutral-800 flex items-center justify-between px-4">
                        <div className="flex gap-4 text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><kbd className="bg-neutral-800 px-1 rounded border border-neutral-700">↑↓</kbd> Navigate</span>
                            <span className="flex items-center gap-1.5"><kbd className="bg-neutral-800 px-1 rounded border border-neutral-700">↵</kbd> Select</span>
                            <span className="flex items-center gap-1.5"><kbd className="bg-neutral-800 px-1 rounded border border-neutral-700">ESC</kbd> Close</span>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
