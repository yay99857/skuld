import React, { useState, useEffect, useRef } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  Folder,
  Tag,
  Plus,
  Keyboard,
  X,
  Edit2,
  Trash2,
  FolderPlus,
  Settings,
} from "lucide-react";
import { useNotes } from "./NoteContext";
import { SettingsModal } from "./SettingsModal";
import { Notebook } from "../database/client";

export const Sidebar: React.FC = () => {
  const {
    notebooks,
    tags,
    selectedNotebook,
    selectedTag,
    setSelectedNotebook,
    selectTag,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    createTag,
    updateTag,
    deleteTag,
    selectionFocus,
    setSelectionFocus,
    createRequest,
    setCreateRequest,
    confirmAction,
    vimMode,
  } = useNotes();
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(
    null
  );
  const [editingName, setEditingName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null);
  const [newSubNotebookName, setNewSubNotebookName] = useState("");

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      await createNotebook(newNotebookName.trim());
      setNewNotebookName("");
      setIsCreatingNotebook(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      await createTag(newTagName.trim());
      setNewTagName("");
      setIsCreatingTag(false);
    }
  };

  const handleRenameNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNotebookId && editingName.trim()) {
      await updateNotebook(editingNotebookId, editingName.trim());
      setEditingNotebookId(null);
    }
  };

  const handleRenameTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTagId && editingTagName.trim()) {
      await updateTag(editingTagId, editingTagName.trim());
      setEditingTagId(null);
    }
  };

  const handleCreateSubNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingParentId && newSubNotebookName.trim()) {
      await createNotebook(newSubNotebookName.trim(), creatingParentId);
      setNewSubNotebookName("");
      setCreatingParentId(null);
    }
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingNotebookId(id);
    setEditingName(currentName);
  };

  const startEditingTag = (id: string, currentName: string) => {
    setEditingTagId(id);
    setEditingTagName(currentName);
  };

  const handleDeleteNotebook = async (id: string) => {
    confirmAction(
      "Delete Notebook",
      "Are you sure you want to delete this notebook? All notes and sub-notebooks inside will be deleted.",
      async () => {
        try {
          await deleteNotebook(id);
          if (selectedNotebook === id) setSelectedNotebook(null);
        } catch (error) {
          console.error("Failed to delete notebook:", error);
        }
      }
    );
  };

  const handleDeleteTag = async (id: string) => {
    confirmAction(
      "Delete Tag",
      "Are you sure you want to delete this tag? It will be removed from all notes.",
      async () => {
        try {
          await deleteTag(id);
          if (selectedTag === id) selectTag(null);
        } catch (error) {
          console.error("Failed to delete tag:", error);
        }
      }
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        if (selectionFocus === "notebooks" && selectedNotebook) {
          const nb = notebooks.find((n) => n.id === selectedNotebook);
          if (nb) startEditing(nb.id, nb.name);
        } else if (selectionFocus === "tags" && selectedTag) {
          const t = tags.find((tag) => tag.id === selectedTag);
          if (t) startEditingTag(t.id, t.name);
        }
      }

      // Navigation with Arrow keys or Vim j/k when Sidebar is focused
      if (selectionFocus === "notebooks" || selectionFocus === "tags") {
        const isDown = e.key === "ArrowDown" || (vimMode && e.key === "j");
        const isUp = e.key === "ArrowUp" || (vimMode && e.key === "k");
        if (isDown || isUp) {
          e.preventDefault();

          const flattenedItems: Array<{
            type: "notebook" | "tag";
            id: string;
          }> = [];

          const addNotebooks = (parentId: string | null) => {
            notebooks
              .filter((n) => n.parentId === parentId)
              .forEach((nb) => {
                flattenedItems.push({ type: "notebook", id: nb.id });
                addNotebooks(nb.id);
              });
          };
          addNotebooks(null);

          tags.forEach((t) => flattenedItems.push({ type: "tag", id: t.id }));

          const currentId = selectedNotebook || selectedTag;
          const currentIndex = flattenedItems.findIndex(
            (item) => item.id === currentId
          );

          let nextIndex = currentIndex;
          if (isDown) {
            nextIndex = (currentIndex + 1) % flattenedItems.length;
          } else if (isUp) {
            nextIndex =
              (currentIndex - 1 + flattenedItems.length) %
              flattenedItems.length;
          }

          const nextItem = flattenedItems[nextIndex];
          if (nextItem) {
            if (nextItem.type === "notebook") {
              setSelectedNotebook(nextItem.id);
              setSelectionFocus("notebooks");
            } else {
              selectTag(nextItem.id);
              setSelectionFocus("tags");
            }
          }
        }

        // 'a' to create notebook, 'A' (Shift+a) to create sub-notebook when a notebook is selected
        if (e.key === "a" || e.key === "A") {
          if (selectionFocus === "notebooks" && selectedNotebook) {
            e.preventDefault();
            setCreateRequest(e.shiftKey ? "sub-notebook" : "notebook");
          } else if (selectionFocus === "tags") {
            e.preventDefault();
            setCreateRequest("tag");
          }
        }
      }

      if (e.key === "Delete") {
        if (selectionFocus === "notebooks" && selectedNotebook) {
          const nb = notebooks.find((n) => n.id === selectedNotebook);
          if (nb) handleDeleteNotebook(nb.id);
        } else if (selectionFocus === "tags" && selectedTag) {
          const t = tags.find((tag) => tag.id === selectedTag);
          if (t) handleDeleteTag(t.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNotebook,
    selectedTag,
    notebooks,
    tags,
    selectionFocus,
    setSelectedNotebook,
    selectTag,
    setSelectionFocus,
    confirmAction,
    vimMode,
    setCreateRequest,
  ]);

  useEffect(() => {
    if (createRequest === "notebook") {
      setIsCreatingNotebook(true);
      setCreateRequest(null);
      setSelectionFocus("notebooks");
    } else if (createRequest === "tag") {
      setIsCreatingTag(true);
      setCreateRequest(null);
      setSelectionFocus("tags");
    } else if (createRequest === "sub-notebook" && selectedNotebook) {
      setCreatingParentId(selectedNotebook);
      setNewSubNotebookName("");
      setCreateRequest(null);
      setSelectionFocus("notebooks");
    }
  }, [createRequest, setCreateRequest, setSelectionFocus, selectedNotebook]);

  return (
    <div
      className="w-full h-full bg-[#181818] border-r border-neutral-800 flex flex-col relative focus:outline-none"
      tabIndex={0}
      onFocus={() => {
        if (selectionFocus !== "notebooks" && selectionFocus !== "tags") {
          setSelectionFocus("notebooks");
        }
      }}
    >
      <div
        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
          selectionFocus === "notebooks" ? "bg-neutral-800/30" : ""
        }`}
        onClick={() => setSelectionFocus("notebooks")}
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Notebooks
        </h2>
        <button
          onClick={() => setIsCreatingNotebook(true)}
          className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400"
        >
          <Plus size={14} />
        </button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-2">
        <div className="space-y-1">
          {notebooks
            .filter((nb) => !nb.parentId)
            .map((nb) => (
              <NotebookTreeItem
                key={nb.id}
                nb={nb}
                level={0}
                notebooks={notebooks}
                selectedNotebook={selectedNotebook}
                setSelectedNotebook={setSelectedNotebook}
                editingNotebookId={editingNotebookId}
                editingName={editingName}
                setEditingName={setEditingName}
                setEditingNotebookId={setEditingNotebookId}
                handleRenameNotebook={handleRenameNotebook}
                startEditing={startEditing}
                handleDeleteNotebook={handleDeleteNotebook}
                creatingParentId={creatingParentId}
                setCreatingParentId={setCreatingParentId}
                newSubNotebookName={newSubNotebookName}
                setNewSubNotebookName={setNewSubNotebookName}
                handleCreateSubNotebook={handleCreateSubNotebook}
              />
            ))}

          {isCreatingNotebook && (
            <form onSubmit={handleCreateNotebook} className="px-3 py-1.5">
              <input
                autoFocus
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onBlur={() => !newNotebookName && setIsCreatingNotebook(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsCreatingNotebook(false);
                    setNewNotebookName("");
                  }
                }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="Notebook name..."
              />
            </form>
          )}
        </div>

        <div
          className={`mt-8 mb-4 px-2 flex items-center justify-between cursor-pointer transition-colors ${
            selectionFocus === "tags" ? "bg-neutral-800/30" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectionFocus("tags");
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Tags
          </h2>
          <button
            onClick={() => setIsCreatingTag(true)}
            className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-1">
          {tags.length > 0
            ? tags.map((tag) => (
                <div key={tag.id}>
                  {editingTagId === tag.id ? (
                    <form onSubmit={handleRenameTag} className="px-3 py-1.5">
                      <input
                        autoFocus
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        onBlur={() => setEditingTagId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingTagId(null);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                    </form>
                  ) : (
                    <ContextMenu.Root>
                      <ContextMenu.Trigger>
                        <button
                          onClick={() => selectTag(tag.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                            selectedTag === tag.id
                              ? "bg-neutral-800 text-white"
                              : "hover:bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          <Tag
                            size={14}
                            className={
                              selectedTag === tag.id ? "text-purple-400" : ""
                            }
                          />
                          <span>{tag.name}</span>
                        </button>
                      </ContextMenu.Trigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Content className="min-w-[160px] bg-[#252525] rounded-md overflow-hidden p-1 shadow-xl border border-neutral-700 z-50">
                          <ContextMenu.Item
                            onClick={() => startEditingTag(tag.id, tag.name)}
                            className="text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 outline-none"
                          >
                            <Edit2 size={12} /> Rename
                          </ContextMenu.Item>
                          <ContextMenu.Separator className="h-[1px] bg-neutral-700 m-1" />
                          <ContextMenu.Item
                            onClick={() => handleDeleteTag(tag.id)}
                            className="text-xs text-red-400 hover:bg-neutral-700 px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 outline-none"
                          >
                            <Trash2 size={12} /> Delete Tag
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                  )}
                </div>
              ))
            : !isCreatingTag && (
                <p className="px-3 text-[10px] text-neutral-600 italic">
                  No tags yet
                </p>
              )}

          {isCreatingTag && (
            <form onSubmit={handleCreateTag} className="px-3 py-1.5">
              <input
                autoFocus
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onBlur={() => !newTagName && setIsCreatingTag(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsCreatingTag(false);
                    setNewTagName("");
                  }
                }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="Tag name..."
              />
            </form>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-neutral-800 bg-[#141414]">
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-medium"
        >
          <Keyboard size={14} />
          <span>Shortcuts</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-medium"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
            o_o
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-white text-xs">yay</p>
          </div>
        </div>
      </div>

      {/* Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-neutral-700 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Keyboard size={16} /> Shortcuts
              </h3>
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs uppercase text-neutral-500 font-bold mb-2">
                    View Modes
                  </h4>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Editor Only</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Alt+1
                      </kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Side-by-side</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Alt+2
                      </kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Preview Only</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Alt+3
                      </kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Toggle Preview</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Ctrl+E
                      </kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Zoom In/Out</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Ctrl + / -
                      </kbd>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs uppercase text-neutral-500 font-bold mb-2">
                    General
                  </h4>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Toggle Sidebar</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Ctrl+B
                      </kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-neutral-400">New Note</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Ctrl+N
                      </kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-neutral-400">New Sub-Notebook</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Ctrl+Shift+N
                      </kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Delete Note</span>{" "}
                      <kbd className="bg-neutral-800 px-1.5 rounded text-xs border border-neutral-700">
                        Ctrl+D
                      </kbd>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-center">
              <span className="text-xs text-neutral-500">
                Press{" "}
                <kbd className="bg-neutral-800 px-1 rounded border border-neutral-700">
                  Esc
                </kbd>{" "}
                to close
              </span>
            </div>
          </div>
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsShortcutsOpen(false)}
          />
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

interface NotebookTreeItemProps {
  nb: Notebook;
  level: number;
  notebooks: Notebook[];
  selectedNotebook: string | null;
  setSelectedNotebook: (id: string | null) => void;
  editingNotebookId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  setEditingNotebookId: (id: string | null) => void;
  handleRenameNotebook: (e: React.FormEvent) => Promise<void>;
  startEditing: (id: string, name: string) => void;
  handleDeleteNotebook: (id: string) => Promise<void>;
  creatingParentId: string | null;
  setCreatingParentId: (id: string | null) => void;
  newSubNotebookName: string;
  setNewSubNotebookName: (name: string) => void;
  handleCreateSubNotebook: (e: React.FormEvent) => Promise<void>;
}

const NotebookTreeItem: React.FC<NotebookTreeItemProps> = ({
  nb,
  level,
  notebooks,
  selectedNotebook,
  setSelectedNotebook,
  editingNotebookId,
  editingName,
  setEditingName,
  setEditingNotebookId,
  handleRenameNotebook,
  startEditing,
  handleDeleteNotebook,
  creatingParentId,
  setCreatingParentId,
  newSubNotebookName,
  setNewSubNotebookName,
  handleCreateSubNotebook,
}) => {
  const children = notebooks.filter((child) => child.parentId === nb.id);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingParentId === nb.id && inputRef.current) {
      // Small delay to ensure it focuses after ContextMenu closure/focus-restoration
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [creatingParentId, nb.id]);

  return (
    <div key={nb.id}>
      {editingNotebookId === nb.id ? (
        <form
          onSubmit={handleRenameNotebook}
          className="px-3 py-1.5"
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          <input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => setEditingNotebookId(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingNotebookId(null);
            }}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </form>
      ) : (
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <button
              onClick={() => setSelectedNotebook(nb.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedNotebook === nb.id
                  ? "bg-neutral-800 text-white"
                  : "hover:bg-neutral-800 text-neutral-400"
              }`}
              style={{ paddingLeft: `${(level + 1) * 12}px` }}
            >
              <Folder
                size={16}
                className={selectedNotebook === nb.id ? "text-purple-400" : ""}
              />
              <span className="truncate">{nb.name}</span>
            </button>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content className="min-w-[160px] bg-[#252525] rounded-md overflow-hidden p-1 shadow-xl border border-neutral-700 z-50">
              <ContextMenu.Item
                onClick={() => startEditing(nb.id, nb.name)}
                className="text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 outline-none"
              >
                <Edit2 size={12} /> Rename
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => {
                  setCreatingParentId(nb.id);
                  setNewSubNotebookName("");
                }}
                className="text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 outline-none"
              >
                <FolderPlus size={12} /> Add Sub-Notebook
              </ContextMenu.Item>
              <ContextMenu.Separator className="h-[1px] bg-neutral-700 m-1" />
              <ContextMenu.Item
                onClick={() => handleDeleteNotebook(nb.id)}
                className="text-xs text-red-400 hover:bg-neutral-700 px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 outline-none"
              >
                <Trash2 size={12} /> Delete Notebook
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      )}

      {children.length > 0 && (
        <div className="space-y-1">
          {children.map((child) => (
            <NotebookTreeItem
              key={child.id}
              nb={child}
              level={level + 1}
              notebooks={notebooks}
              selectedNotebook={selectedNotebook}
              setSelectedNotebook={setSelectedNotebook}
              editingNotebookId={editingNotebookId}
              editingName={editingName}
              setEditingName={setEditingName}
              setEditingNotebookId={setEditingNotebookId}
              handleRenameNotebook={handleRenameNotebook}
              startEditing={startEditing}
              handleDeleteNotebook={handleDeleteNotebook}
              creatingParentId={creatingParentId}
              setCreatingParentId={setCreatingParentId}
              newSubNotebookName={newSubNotebookName}
              setNewSubNotebookName={setNewSubNotebookName}
              handleCreateSubNotebook={handleCreateSubNotebook}
            />
          ))}
        </div>
      )}

      {creatingParentId === nb.id && (
        <form
          onSubmit={handleCreateSubNotebook}
          className="px-3 py-1.5"
          style={{ paddingLeft: `${(level + 2) * 12}px` }}
        >
          <input
            ref={inputRef}
            autoFocus
            value={newSubNotebookName}
            onChange={(e) => setNewSubNotebookName(e.target.value)}
            onBlur={() => !newSubNotebookName && setCreatingParentId(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setCreatingParentId(null);
                setNewSubNotebookName("");
              }
            }}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="Sub-notebook name..."
          />
        </form>
      )}
    </div>
  );
};
