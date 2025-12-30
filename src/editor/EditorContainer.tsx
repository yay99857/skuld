import React, { useState, useEffect, useRef } from "react";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { Editor } from "./Editor";
import { MarkdownPreview } from "../markdown/MarkdownPreview";
import { Maximize2, Columns, Eye, Trash2, PanelLeft } from "lucide-react";
import { useNotes } from "../ui/NoteContext";

export type ViewMode = "both" | "editor" | "preview";

interface EditorContainerProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
  viewMode,
  setViewMode,
}) => {
  const {
    selectedNote,
    updateNote,
    deleteNote,
    selectionFocus,
    setSelectionFocus,
    confirmAction,
    vimMode,
    setVimMode,
    editorFontSize,
    setEditorFontSize,
    previewFontSize,
    editorFontFamily,
    previewFontFamily,
  } = useNotes();
  const [content, setContent] = useState(selectedNote?.content || "");
  const [title, setTitle] = useState(selectedNote?.title || "");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear any pending saves from the previous note immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (selectedNote) {
      setContent(selectedNote.content);
      setTitle(selectedNote.title);
    } else {
      setContent("");
      setTitle("");
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      window.removeEventListener("keydown", handleZoom);
    };
  }, [selectedNote?.id]); // Use .id to avoid unnecessary resets if the object reference changes but not the note

  const handleZoom = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setEditorFontSize(Math.min(editorFontSize + 2, 32));
      } else if (e.key === "-") {
        e.preventDefault();
        setEditorFontSize(Math.max(editorFontSize - 2, 10));
      } else if (e.key === "0") {
        e.preventDefault();
        setEditorFontSize(16);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleZoom);
    return () => window.removeEventListener("keydown", handleZoom);
  }, []);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const noteId = selectedNote?.id;
    if (!noteId) return;

    saveTimeoutRef.current = setTimeout(async () => {
      // Re-check selectedNote.id and equality before saving
      if (selectedNote?.id === noteId && newContent !== selectedNote.content) {
        await updateNote(noteId, { content: newContent });
      }
    }, 1000);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const noteId = selectedNote?.id;
    if (!noteId) return;

    saveTimeoutRef.current = setTimeout(async () => {
      if (selectedNote?.id === noteId && newTitle !== selectedNote.title) {
        await updateNote(noteId, { title: newTitle.trim() });
      }
    }, 1000);
  };

  const handleDelete = async () => {
    if (selectedNote) {
      confirmAction(
        "Delete Note",
        "Are you sure you want to delete this note? This action cannot be undone.",
        async () => {
          await deleteNote(selectedNote.id);
        }
      );
    }
  };

  if (!selectedNote) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e",
          color: "#666",
        }}
      >
        <PlusCircle size={48} className="mb-4 opacity-20" />
        <p className="text-sm">Select or create a note to start writing</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col flex-1 min-w-0 h-full bg-[#1e1e1e] transition-colors focus:outline-none ${
        selectionFocus === "editor"
          ? "ring-1 ring-inset ring-purple-500/30"
          : ""
      }`}
      tabIndex={0}
      onFocus={(e) => {
        if (e.target === containerRef.current) {
          setSelectionFocus("editor");
        }
      }}
      onClick={() => setSelectionFocus("editor")}
    >
      {/* Header */}
      <div className="h-12 border-b border-neutral-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Toggle sidebar button when in editor mode */}
          {viewMode === "editor" && (
            <button
              onClick={() => setViewMode("both")}
              className="p-1.5 hover:bg-neutral-700/50 text-neutral-500 hover:text-neutral-300 rounded-md transition-colors"
              title="Show Sidebar"
            >
              <PanelLeft size={16} />
            </button>
          )}
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-semibold text-white focus:outline-none placeholder-neutral-600"
            placeholder="Note Title"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVimMode(!vimMode)}
            className={`px-2 py-0.5 text-xs font-mono rounded transition-all ${
              vimMode
                ? "bg-green-900/50 text-green-400 border border-green-800"
                : "hover:bg-neutral-800 text-neutral-500"
            }`}
            title="Vim Mode (Ctrl+Alt+V)"
          >
            VIM
          </button>
          <div className="flex items-center gap-1 bg-neutral-800/50 p-1 rounded-md border border-neutral-800">
            <button
              onClick={() => setViewMode("editor")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "editor"
                  ? "bg-neutral-700 text-purple-400 shadow-sm"
                  : "hover:bg-neutral-700/50 text-neutral-500"
              }`}
              title="Focus Mode (Alt + 1)"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={() => setViewMode("both")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "both"
                  ? "bg-neutral-700 text-purple-400 shadow-sm"
                  : "hover:bg-neutral-700/50 text-neutral-500"
              }`}
              title="Side-by-side (Alt + 2)"
            >
              <Columns size={14} />
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "preview"
                  ? "bg-neutral-700 text-purple-400 shadow-sm"
                  : "hover:bg-neutral-700/50 text-neutral-500"
              }`}
              title="Preview Only (Alt + 3)"
            >
              <Eye size={14} />
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded-md transition-colors"
            title="Delete Note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {viewMode === "editor" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              backgroundColor: "#121212",
            }}
          >
            <Editor
              value={content}
              onChange={handleContentChange}
              vimMode={vimMode}
              autoFocus={selectionFocus === "editor"}
              fontSize={editorFontSize}
              fontFamily={editorFontFamily}
            />
          </div>
        )}
        {viewMode === "preview" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              backgroundColor: "#1a1a1a",
            }}
          >
            <div className="max-w-3xl mx-auto p-6">
              <MarkdownPreview
                content={content}
                onContentChange={handleContentChange}
                fontSize={previewFontSize}
                fontFamily={previewFontFamily}
              />
            </div>
          </div>
        )}
        {viewMode === "both" && (
          <PanelGroup
            orientation="horizontal"
            className="w-full h-full min-h-0"
          >
            <Panel defaultSize="50" minSize="20" className="min-h-0">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  backgroundColor: "#121212",
                  borderRight: "1px solid #333",
                }}
              >
                <Editor
                  value={content}
                  onChange={handleContentChange}
                  vimMode={vimMode}
                  autoFocus={selectionFocus === "editor"}
                  fontSize={editorFontSize}
                  fontFamily={editorFontFamily}
                />
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#252525] hover:bg-purple-500 transition-colors flex items-center justify-center group">
              <div className="w-[2px] h-8 rounded-full bg-neutral-700 group-hover:bg-white transition-colors" />
            </PanelResizeHandle>
            <Panel defaultSize="50" minSize="20" className="min-h-0">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  backgroundColor: "#1a1a1a",
                }}
              >
                <div className="max-w-3xl mx-auto p-6">
                  <MarkdownPreview
                    content={content}
                    onContentChange={handleContentChange}
                    fontSize={previewFontSize}
                    fontFamily={previewFontFamily}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
};

const PlusCircle = ({
  size,
  className,
}: {
  size: number;
  className: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);
