import React from "react";
import { X, Type, FileCode, Keyboard } from "lucide-react";
import { useNotes } from "./NoteContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    editorFontSize,
    setEditorFontSize,
    previewFontSize,
    setPreviewFontSize,
    editorFontFamily,
    setEditorFontFamily,
    previewFontFamily,
    setPreviewFontFamily,
    vimMode,
    setVimMode,
  } = useNotes();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-neutral-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between bg-neutral-900/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FileCode size={18} className="text-purple-400" /> Settings
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Editor Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Type size={16} /> Editor Font Size
              </label>
              <span className="text-xs font-mono bg-neutral-800 px-2 py-1 rounded text-purple-300">
                {editorFontSize}px
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="32"
              step="1"
              value={editorFontSize}
              onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
            />
            <div className="flex justify-between text-xs text-neutral-500 font-mono">
              <span>10px</span>
              <span>32px</span>
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Editor Font Family */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Type size={16} /> Editor Font
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={editorFontFamily}
                  onChange={(e) => setEditorFontFamily(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-sm text-neutral-200 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                >
                  <option>JetBrains Mono</option>
                  <option>Fira Code</option>
                  <option>Source Code Pro</option>
                  <option>Menlo</option>
                  <option>Courier New</option>
                  <option>System UI</option>
                </select>
                <button
                  onClick={() => setEditorFontFamily("JetBrains Mono")}
                  className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="text-xs text-neutral-500">Preview</div>
            <div
              className="p-3 bg-neutral-900 border border-neutral-800 rounded text-sm"
              style={{ fontFamily: editorFontFamily }}
            >
              The quick brown fox jumps over the lazy dog — 0123456789
            </div>
            <p className="text-[10px] text-neutral-500">
              Note: common fonts are loaded via Google Fonts automatically;
              system fonts still require local availability.
            </p>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Preview Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Type size={16} /> Preview Font Size
              </label>
              <span className="text-xs font-mono bg-neutral-800 px-2 py-1 rounded text-purple-300">
                {previewFontSize}px
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="32"
              step="1"
              value={previewFontSize}
              onChange={(e) => setPreviewFontSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
            />
            <div className="flex justify-between text-xs text-neutral-500 font-mono">
              <span>10px</span>
              <span>32px</span>
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Preview Font Family */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Type size={16} /> Preview Font
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={previewFontFamily}
                  onChange={(e) => setPreviewFontFamily(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-sm text-neutral-200 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                >
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Georgia</option>
                  <option>Times New Roman</option>
                  <option>System UI</option>
                  <option>Serif</option>
                </select>
                <button
                  onClick={() => setPreviewFontFamily("Inter")}
                  className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="text-xs text-neutral-500">Preview</div>
            <div
              className="p-3 bg-neutral-900 border border-neutral-800 rounded text-sm"
              style={{ fontFamily: previewFontFamily }}
            >
              The quick brown fox jumps over the lazy dog — 0123456789
            </div>
            <p className="text-[10px] text-neutral-500">
              Note: common fonts are loaded via Google Fonts automatically;
              system fonts still require local availability.
            </p>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Vim Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Keyboard size={16} /> Vim Mode
              </label>
              <p className="text-xs text-neutral-500">
                Enable Vim keybindings in the editor
              </p>
            </div>
            <button
              onClick={() => setVimMode(!vimMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] ${
                vimMode ? "bg-purple-600" : "bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  vimMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      {/* Backdrop click to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
