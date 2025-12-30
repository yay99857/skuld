import React, { useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { useNotes } from './NoteContext';

export const ConfirmationModal: React.FC = () => {
    const { confirmation, closeConfirmation } = useNotes();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const deleteRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (confirmation.isOpen) {
            // Focus cancel by default
            setTimeout(() => cancelRef.current?.focus(), 50);
        }
    }, [confirmation.isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            if (document.activeElement === cancelRef.current) {
                deleteRef.current?.focus();
            } else {
                cancelRef.current?.focus();
            }
        }
    };

    return (
        <Dialog.Root open={confirmation.isOpen} onOpenChange={(open) => !open && closeConfirmation()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in duration-300" />
                <Dialog.Content
                    onKeyDown={handleKeyDown}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#252525] border border-neutral-800 rounded-2xl shadow-2xl z-[201] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
                >
                    <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                            <AlertTriangle size={24} className="text-red-500" />
                        </div>

                        <Dialog.Title className="text-lg font-bold text-white mb-2">
                            {confirmation.title}
                        </Dialog.Title>

                        <Dialog.Description className="text-sm text-neutral-400 leading-relaxed">
                            {confirmation.message}
                        </Dialog.Description>
                    </div>

                    <div className="p-4 bg-neutral-900/50 border-t border-neutral-800 flex gap-3">
                        <button
                            ref={cancelRef}
                            onClick={closeConfirmation}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all border border-neutral-800 hover:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-neutral-800"
                        >
                            Cancel
                        </button>
                        <button
                            ref={deleteRef}
                            onClick={() => {
                                confirmation.onConfirm();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        >
                            Delete
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
