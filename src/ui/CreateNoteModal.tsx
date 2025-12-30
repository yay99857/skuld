import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FilePlus } from 'lucide-react';
import { useNotes } from './NoteContext';

export const CreateNoteModal: React.FC = () => {
    const { createRequest, setCreateRequest, createNote } = useNotes();
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const isOpen = createRequest === 'note';

    useEffect(() => {
        if (isOpen) {
            setName('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleCreate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (name.trim()) {
            await createNote(name.trim(), '');
            setCreateRequest(null);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && setCreateRequest(null)}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in duration-300" />
                <Dialog.Content
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#252525] border border-neutral-800 rounded-2xl shadow-2xl z-[201] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
                >
                    <div className="p-6">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border border-purple-500/20">
                            <FilePlus size={24} className="text-purple-500" />
                        </div>

                        <Dialog.Title className="text-lg font-bold text-white mb-1">
                            New Note
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-neutral-400 mb-4">
                            Give your new note a name to get started.
                        </Dialog.Description>

                        <form onSubmit={handleCreate}>
                            <input
                                ref={inputRef}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Note name..."
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                            />
                        </form>
                    </div>

                    <div className="p-4 bg-neutral-900/50 border-t border-neutral-800 flex gap-3">
                        <button
                            onClick={() => setCreateRequest(null)}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all border border-neutral-800 hover:border-neutral-700 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleCreate()}
                            disabled={!name.trim()}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            Create Note
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
