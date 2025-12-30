import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import * as db from "../database/client";
import { Note, Notebook, Tag } from "../database/client";

interface NoteContextType {
  notes: Note[];
  notebooks: Notebook[];
  tags: Tag[];
  selectedNote: Note | null;
  selectedNoteIds: string[];
  selectedNotebook: string | null;
  selectedTag: string | null;
  searchQuery: string;
  loading: boolean;
  noteTags: Tag[];
  selectionFocus: "notebooks" | "tags" | "notes" | "editor" | null;
  setSelectionFocus: (
    focus: "notebooks" | "tags" | "notes" | "editor" | null
  ) => void;
  createRequest: "notebook" | "tag" | "note" | "sub-notebook" | null;
  setCreateRequest: (
    req: "notebook" | "tag" | "note" | "sub-notebook" | null
  ) => void;
  isQuickOpen: boolean;
  setIsQuickOpen: (open: boolean) => void;
  confirmation: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  };
  confirmAction: (
    title: string,
    message: string,
    onConfirm: () => void
  ) => void;
  closeConfirmation: () => void;
  vimMode: boolean;
  setVimMode: React.Dispatch<React.SetStateAction<boolean>>;
  editorFontSize: number;
  setEditorFontSize: (size: number) => void;
  previewFontSize: number;
  setPreviewFontSize: (size: number) => void;

  editorFontFamily: string;
  setEditorFontFamily: (font: string) => void;
  previewFontFamily: string;
  setPreviewFontFamily: (font: string) => void;

  setSearchQuery: (query: string) => void;
  setSelectedNotebook: (id: string | null) => void;
  selectTag: (id: string | null) => void;
  selectNote: (
    id: string | null,
    options?: { isShift?: boolean; isCtrl?: boolean }
  ) => void;
  createNote: (title: string, content: string) => Promise<Note>;
  updateNote: (
    id: string,
    data: { title?: string; content?: string; notebookId?: string | null }
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  deleteNotes: (ids: string[]) => Promise<void>;
  createNotebook: (name: string, parentId?: string) => Promise<void>;
  updateNotebook: (id: string, name: string) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  createTag: (name: string) => Promise<void>;
  updateTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addTagToNote: (noteId: string, tagId: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [selectionFocus, setSelectionFocus] = useState<
    "notebooks" | "tags" | "notes" | "editor" | null
  >(null);
  const [createRequest, setCreateRequest] = useState<
    "notebook" | "tag" | "note" | "sub-notebook" | null
  >(null);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [vimMode, setVimMode] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(16);
  const [previewFontSize, setPreviewFontSize] = useState(16);

  const [editorFontFamily, setEditorFontFamily] =
    useState<string>("JetBrains Mono");
  const [previewFontFamily, setPreviewFontFamily] = useState<string>("Inter");

  const [allNoteTags, setAllNoteTags] = useState<
    Array<{ note_id: string; tag_id: string }>
  >([]);

  // Load persisted font families
  useEffect(() => {
    try {
      const ef = localStorage.getItem("editorFontFamily");
      const pf = localStorage.getItem("previewFontFamily");
      if (ef) setEditorFontFamily(ef);
      if (pf) setPreviewFontFamily(pf);
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist when changed
  useEffect(() => {
    try {
      localStorage.setItem("editorFontFamily", editorFontFamily);
    } catch (e) {}
  }, [editorFontFamily]);

  useEffect(() => {
    try {
      localStorage.setItem("previewFontFamily", previewFontFamily);
    } catch (e) {}
  }, [previewFontFamily]);

  // Apply CSS variables so UI updates to selected preview/editor fonts
  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--preview-font', previewFontFamily);
    } catch (e) {}
  }, [previewFontFamily]);

  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--editor-font', editorFontFamily);
    } catch (e) {}
  }, [editorFontFamily]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const allNotes = await db.getNotes();
      const allNotebooks = await db.getNotebooks();
      const allTags = await db.getTags();
      const allNT = await db.getAllNoteTags(); // Ensure this exists in client.ts
      setNotes(allNotes);
      setNotebooks(allNotebooks);
      setTags(allTags);
      setAllNoteTags(allNT);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const selectTag = useCallback((id: string | null) => {
    setSelectedTag(id);
    if (id) {
      setSelectedNotebook(null);
      setSelectionFocus("tags");
    }
  }, []);

  const handleSetSelectedNotebook = useCallback((id: string | null) => {
    setSelectedNotebook(id);
    if (id) {
      setSelectedTag(null);
      setSelectionFocus("notebooks");
    }
  }, []);

  const confirmAction = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          onConfirm();
          setConfirmation((prev) => ({ ...prev, isOpen: false }));
        },
      });
    },
    []
  );

  const closeConfirmation = useCallback(() => {
    setConfirmation((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCreateNote = useCallback(
    async (title: string, content: string) => {
      try {
        const newNote = await db.createNote(
          title,
          content,
          selectedNotebook || undefined
        );
        await refreshData();
        setSelectedNote(newNote);
        return newNote;
      } catch (error) {
        console.error("Failed to create note:", error);
        throw error;
      }
    },
    [selectedNotebook, refreshData]
  );

  const handleUpdateNote = useCallback(
    async (
      id: string,
      data: { title?: string; content?: string; notebookId?: string | null }
    ) => {
      try {
        const updatedNote = await db.updateNote(id, data);
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, ...updatedNote } : n))
        );
        if (selectedNote?.id === id) {
          setSelectedNote({ ...selectedNote, ...updatedNote });
        }
      } catch (error) {
        console.error("Failed to update note:", error);
        throw error;
      }
    },
    [selectedNote]
  );

  const handleCreateNotebook = useCallback(
    async (name: string, parentId?: string) => {
      try {
        await db.createNotebook(name, parentId);
        await refreshData();
      } catch (error) {
        console.error("Failed to create notebook:", error);
        throw error;
      }
    },
    [refreshData]
  );

  const handleUpdateNotebook = useCallback(
    async (id: string, name: string) => {
      try {
        await db.updateNotebook(id, name);
        await refreshData();
      } catch (error) {
        console.error("Failed to update notebook:", error);
        throw error;
      }
    },
    [refreshData]
  );

  const handleDeleteNotebook = useCallback(
    async (id: string) => {
      try {
        await db.deleteNotebook(id);
        await refreshData();
        if (selectedNotebook === id) setSelectedNotebook(null);
      } catch (error) {
        console.error("Failed to delete notebook:", error);
        throw error;
      }
    },
    [selectedNotebook, refreshData]
  );

  const handleCreateTag = useCallback(
    async (name: string) => {
      try {
        await db.createTag(name);
        await refreshData();
      } catch (error) {
        console.error("Failed to create tag:", error);
        throw error;
      }
    },
    [refreshData]
  );

  const handleUpdateTag = useCallback(
    async (id: string, name: string) => {
      try {
        await db.updateTag(id, name);
        await refreshData();
      } catch (error) {
        console.error("Failed to update tag:", error);
        throw error;
      }
    },
    [refreshData]
  );

  const handleDeleteTag = useCallback(
    async (id: string) => {
      try {
        await db.deleteTag(id);
        await refreshData(); // Cascade handles note_tags cleanup, refresh updates UI
        if (selectedTag === id) setSelectedTag(null);
      } catch (error) {
        console.error("Failed to delete tag:", error);
        throw error;
      }
    },
    [selectedTag, refreshData]
  );

  const handleAddTagToNote = useCallback(
    async (noteId: string, tagId: string) => {
      try {
        await db.addTagToNote(noteId, tagId);
        await refreshData();
        const tags = await db.getNoteTags(noteId);
        setNoteTags(tags);
      } catch (error) {
        console.error("Failed to add tag:", error);
      }
    },
    [refreshData]
  );

  const handleRemoveTagFromNote = useCallback(
    async (noteId: string, tagId: string) => {
      try {
        await db.removeTagFromNote(noteId, tagId);
        await refreshData();
        const tags = await db.getNoteTags(noteId);
        setNoteTags(tags);
      } catch (error) {
        console.error("Failed to remove tag:", error);
      }
    },
    [refreshData]
  );

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesNotebook =
        !selectedNotebook || note.notebookId === selectedNotebook;

      const matchesTag =
        !selectedTag ||
        allNoteTags.some(
          (nt) => nt.note_id === note.id && nt.tag_id === selectedTag
        );

      return matchesSearch && matchesNotebook && matchesTag;
    });
  }, [notes, searchQuery, selectedNotebook, selectedTag, allNoteTags]);

  const selectNote = useCallback(
    (id: string | null, options?: { isShift?: boolean; isCtrl?: boolean }) => {
      if (!id) {
        setSelectedNote(null);
        setSelectedNoteIds([]);
        return;
      }

      const note = filteredNotes.find((n) => n.id === id) || null;

      if (options?.isCtrl) {
        setSelectedNoteIds((prev) => {
          const isSelected = prev.includes(id);
          if (isSelected) {
            return prev.filter((i) => i !== id);
          } else {
            return [...prev, id];
          }
        });
        // Update selectedNote for editor if adding or if it's the last one
        setSelectedNote(note);
      } else if (options?.isShift && selectedNote) {
        const lastId = selectedNote.id;
        const startIdx = filteredNotes.findIndex((n) => n.id === lastId);
        const endIdx = filteredNotes.findIndex((n) => n.id === id);

        if (startIdx !== -1 && endIdx !== -1) {
          const range = filteredNotes
            .slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1)
            .map((n) => n.id);
          setSelectedNoteIds(range);
        }
      } else {
        setSelectedNoteIds([id]);
        setSelectedNote(note);
      }
    },
    [filteredNotes, selectedNote]
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      try {
        await db.deleteNote(id);
        await refreshData();
        if (selectedNote?.id === id) setSelectedNote(null);
        setSelectedNoteIds((prev) => prev.filter((i) => i !== id));
      } catch (error) {
        console.error("Failed to delete note:", error);
        throw error;
      }
    },
    [selectedNote, refreshData]
  );

  const handleDeleteNotes = useCallback(
    async (ids: string[]) => {
      try {
        for (const id of ids) {
          await db.deleteNote(id);
        }
        await refreshData();
        if (selectedNote && ids.includes(selectedNote.id))
          setSelectedNote(null);
        setSelectedNoteIds((prev) => prev.filter((id) => !ids.includes(id)));
      } catch (error) {
        console.error("Failed to delete multiple notes:", error);
        throw error;
      }
    },
    [selectedNote, refreshData]
  );

  useEffect(() => {
    if (!loading && notebooks.length > 0 && !selectedNotebook && !selectedTag) {
      const firstNotebookId = notebooks[0].id;
      handleSetSelectedNotebook(firstNotebookId);

      // Auto-select first note of the first notebook
      const firstNote = notes.find((n) => n.notebookId === firstNotebookId);
      if (firstNote) {
        setSelectedNote(firstNote);
        setSelectedNoteIds([firstNote.id]);
      }
    }
  }, [
    loading,
    notebooks,
    selectedNotebook,
    selectedTag,
    handleSetSelectedNotebook,
    notes,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (selectionFocus === "notebooks") {
          if (e.shiftKey) {
            setCreateRequest("sub-notebook");
          } else {
            setCreateRequest("notebook");
          }
        } else if (selectionFocus === "tags") {
          setCreateRequest("tag");
        } else {
          setCreateRequest("note");
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        if (selectedNote) {
          selectNote(null);
        }
      }

      // Tab cycles between Sidebar (notebooks), NoteList (notes) and Editor when vimMode is enabled
      if (vimMode && e.key === "Tab") {
        e.preventDefault();
        const order: Array<"notebooks" | "notes" | "editor"> = [
          "notebooks",
          "notes",
          "editor",
        ];
        const current =
          (selectionFocus as "notebooks" | "notes" | "editor") || "notebooks";
        const idx = order.indexOf(current);
        const nextIdx = e.shiftKey
          ? (idx - 1 + order.length) % order.length
          : (idx + 1) % order.length;
        setSelectionFocus(order[nextIdx]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleCreateNote,
    selectionFocus,
    selectedNote,
    handleDeleteNote,
    selectNote,
    vimMode,
    setSelectionFocus,
  ]);

  return (
    <NoteContext.Provider
      value={{
        notes: filteredNotes,
        notebooks,
        tags,
        selectedNote,
        selectedNoteIds,
        selectedNotebook,
        selectedTag,
        searchQuery,
        loading,
        noteTags,
        selectionFocus,
        setSelectionFocus,
        createRequest,
        setCreateRequest,
        isQuickOpen,
        setSearchQuery,
        setIsQuickOpen,
        confirmation,
        confirmAction,
        closeConfirmation,
        vimMode,
        setVimMode,
        editorFontSize,
        setEditorFontSize,
        previewFontSize,
        setPreviewFontSize,
        editorFontFamily,
        setEditorFontFamily,
        previewFontFamily,
        setPreviewFontFamily,
        setSelectedNotebook: handleSetSelectedNotebook,
        selectTag,
        selectNote,
        createNote: handleCreateNote,
        updateNote: handleUpdateNote,
        deleteNote: handleDeleteNote,
        deleteNotes: handleDeleteNotes,
        createNotebook: handleCreateNotebook,
        updateNotebook: handleUpdateNotebook,
        deleteNotebook: handleDeleteNotebook,
        createTag: handleCreateTag,
        updateTag: handleUpdateTag,
        deleteTag: handleDeleteTag,
        addTagToNote: handleAddTagToNote,
        removeTagFromNote: handleRemoveTagFromNote,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (!context) throw new Error("useNotes must be used within NoteProvider");
  return context;
};
