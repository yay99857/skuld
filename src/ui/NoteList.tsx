import React, { useEffect, useState } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  Search,
  Plus,
  Tag as TagIcon,
  ChevronRight,
  Check,
} from "lucide-react";
import { useNotes } from "./NoteContext";
import { format } from "date-fns";
import { Tag } from "../database/client";
import * as db from "../database/client";

export const NoteList: React.FC = () => {
  const {
    notes,
    tags,
    selectedNote,
    selectedNoteIds,
    selectNote,
    searchQuery,
    setSearchQuery,
    deleteNote,
    deleteNotes,
    updateNote,
    addTagToNote,
    removeTagFromNote,
    selectionFocus,
    setSelectionFocus,
    confirmAction,
    setCreateRequest,
    vimMode,
  } = useNotes();
  const [notesTags, setNotesTags] = useState<Record<string, Tag[]>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      const map: Record<string, Tag[]> = {};
      for (const note of notes) {
        map[note.id] = await db.getNoteTags(note.id);
      }
      setNotesTags(map);
    };
    if (notes.length > 0) fetchTags();
  }, [notes]);

  // Update tags for a specific note when changed
  const refreshNoteTags = async (noteId: string) => {
    const t = await db.getNoteTags(noteId);
    setNotesTags((prev) => ({ ...prev, [noteId]: t }));
  };

  const handleDelete = async (id: string) => {
    confirmAction(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      async () => {
        try {
          await deleteNote(id);
        } catch (error) {
          console.error("Failed to delete note:", error);
        }
      }
    );
  };

  const toggleTag = async (
    noteId: string,
    tagId: string,
    isActive: boolean
  ) => {
    if (isActive) {
      await removeTagFromNote(noteId, tagId);
    } else {
      await addTagToNote(noteId, tagId);
    }
    await refreshNoteTags(noteId);
  };

  const handleRenameNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNoteId && editingTitle.trim()) {
      await updateNote(editingNoteId, { title: editingTitle.trim() });
      setEditingNoteId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectionFocus !== "notes") return;

      // 'a' opens new note when in NoteList
      if (e.key === "a") {
        e.preventDefault();
        setCreateRequest("note");
        return;
      }

      if (e.key === "F2" && selectedNote) {
        setEditingNoteId(selectedNote.id);
        setEditingTitle(selectedNote.title);
      }

      const isDown = e.key === "ArrowDown" || (vimMode && e.key === "j");
      const isUp = e.key === "ArrowUp" || (vimMode && e.key === "k");

      if (isDown || isUp) {
        e.preventDefault();
        const currentIndex = notes.findIndex((n) => n.id === selectedNote?.id);
        let nextIndex = 0;

        if (isDown) {
          nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
          if (nextIndex >= notes.length) nextIndex = notes.length - 1;
        } else {
          nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
        }

        if (notes[nextIndex]) {
          selectNote(notes[nextIndex].id, { isShift: e.shiftKey });
        }
      }

      if (e.key === "Enter" && selectedNote) {
        e.preventDefault();
        setSelectionFocus("editor");
      }

      if (e.key === "Delete") {
        if (selectedNoteIds.length > 1) {
          confirmAction(
            "Delete Multiple Notes",
            `Are you sure you want to delete ${selectedNoteIds.length} notes? This action cannot be undone.`,
            async () => {
              await deleteNotes(selectedNoteIds);
            }
          );
        } else if (selectedNote) {
          handleDelete(selectedNote.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNote,
    selectionFocus,
    notes,
    selectNote,
    vimMode,
    setCreateRequest,
  ]);

  useEffect(() => {
    if (selectionFocus === "notes" && !selectedNote && notes.length > 0) {
      selectNote(notes[0].id);
    }
  }, [selectionFocus, selectedNote, notes, selectNote]);

  return (
    <div
      className={`w-full h-full bg-[#1e1e1e] border-r border-neutral-800 flex flex-col transition-colors focus:outline-none ${
        selectionFocus === "notes" ? "ring-1 ring-inset ring-purple-500/30" : ""
      }`}
      tabIndex={0}
      onFocus={() => setSelectionFocus("notes")}
      onClick={() => setSelectionFocus("notes")}
    >
      <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-2.5 text-neutral-500"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-purple-500/20 text-neutral-200"
          />
        </div>
        <button
          onClick={() => setCreateRequest("note")}
          className="p-2 hover:bg-neutral-800 text-purple-400 rounded-md transition-colors border border-neutral-800"
          title="New Note"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
        <div className="p-2 space-y-1">
          {notes.length > 0 ? (
            notes.map((note) => (
              <ContextMenu.Root key={note.id}>
                <ContextMenu.Trigger>
                  <div
                    onClick={(e) =>
                      selectNote(note.id, {
                        isShift: e.shiftKey,
                        isCtrl: e.ctrlKey || e.metaKey,
                      })
                    }
                    className={`p-3 rounded-lg cursor-pointer transition-all select-none ${
                      selectedNoteIds.includes(note.id)
                        ? "bg-neutral-800 shadow-sm border border-neutral-700"
                        : "hover:bg-neutral-800/40 border border-transparent"
                    } ${
                      selectedNote?.id === note.id
                        ? "ring-1 ring-purple-500/50"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      {editingNoteId === note.id ? (
                        <form
                          onSubmit={handleRenameNote}
                          className="flex-1 pr-2"
                        >
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => setEditingNoteId(null)}
                            onKeyDown={(e) => {
                              e.stopPropagation(); // Prevent card selection logic if any
                              if (e.key === "Escape") setEditingNoteId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
                          />
                        </form>
                      ) : (
                        <h3
                          className={`font-medium truncate pr-2 ${
                            selectedNote?.id === note.id
                              ? "text-white"
                              : "text-neutral-300"
                          }`}
                        >
                          {note.title || "Untitled Note"}
                        </h3>
                      )}
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap mt-1">
                        {format(new Date(note.updatedAt), "MMM d")}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-2">
                      {note.content
                        ? note.content.substring(0, 100)
                        : "No content"}
                    </p>

                    {/* Tags Display */}
                    {notesTags[note.id] && notesTags[note.id].length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {notesTags[note.id].map((tag) => (
                          <span
                            key={tag.id}
                            className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1"
                          >
                            <TagIcon size={8} /> {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </ContextMenu.Trigger>

                <ContextMenu.Portal>
                  <ContextMenu.Content className="min-w-[160px] bg-[#252525] rounded-md overflow-hidden p-1 shadow-xl border border-neutral-700 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <ContextMenu.Sub>
                      <ContextMenu.SubTrigger className="text-xs text-white px-2 py-1.5 rounded hover:bg-neutral-700 outline-none cursor-pointer flex items-center justify-between data-[state=open]:bg-neutral-700">
                        Tags
                        <ChevronRight
                          size={12}
                          className="ml-auto text-neutral-500"
                        />
                      </ContextMenu.SubTrigger>
                      <ContextMenu.Portal>
                        <ContextMenu.SubContent className="min-w-[140px] bg-[#252525] rounded-md overflow-hidden p-1 shadow-xl border border-neutral-700 ml-1 animate-in slide-in-from-left-2 duration-100">
                          {tags.length > 0 ? (
                            tags.map((tag) => {
                              const isActive = notesTags[note.id]?.some(
                                (t) => t.id === tag.id
                              );
                              return (
                                <ContextMenu.Item
                                  key={tag.id}
                                  onClick={(e) => {
                                    e.preventDefault(); // Keep menu open
                                    toggleTag(note.id, tag.id, !!isActive);
                                  }}
                                  className="text-xs text-neutral-300 hover:text-white hover:bg-purple-500/20 px-2 py-1.5 rounded cursor-pointer truncate flex items-center gap-2 outline-none group"
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full border border-neutral-600 flex items-center justify-center transition-colors ${
                                      isActive
                                        ? "bg-purple-500 border-purple-500"
                                        : "bg-transparent"
                                    }`}
                                  >
                                    {isActive && (
                                      <Check size={8} className="text-white" />
                                    )}
                                  </div>
                                  {tag.name}
                                </ContextMenu.Item>
                              );
                            })
                          ) : (
                            <div className="px-2 py-1.5 text-[10px] text-neutral-500 italic">
                              No tags created
                            </div>
                          )}
                        </ContextMenu.SubContent>
                      </ContextMenu.Portal>
                    </ContextMenu.Sub>

                    <ContextMenu.Separator className="h-[1px] bg-neutral-700 m-1" />

                    <ContextMenu.Item
                      onSelect={() => {
                        if (
                          selectedNoteIds.length > 1 &&
                          selectedNoteIds.includes(note.id)
                        ) {
                          confirmAction(
                            "Delete Multiple Notes",
                            `Are you sure you want to delete ${selectedNoteIds.length} notes? This action cannot be undone.`,
                            async () => {
                              await deleteNotes(selectedNoteIds);
                            }
                          );
                        } else {
                          handleDelete(note.id);
                        }
                      }}
                      className="text-xs text-red-400 px-2 py-1.5 rounded hover:bg-neutral-700 outline-none cursor-pointer flex items-center gap-2"
                    >
                      {selectedNoteIds.length > 1 &&
                      selectedNoteIds.includes(note.id)
                        ? `Delete ${selectedNoteIds.length} Notes`
                        : "Delete Note"}
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-neutral-600 italic">No notes found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
