import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { editorTheme } from "./theme";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { vim } from "@replit/codemirror-vim";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  vimMode?: boolean;
  autoFocus?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  vimMode = false,
  autoFocus = false,
  fontSize = 16,
  fontFamily = "JetBrains Mono",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fontSizeCompartment = useRef(new Compartment());
  const fontFamilyCompartment = useRef(new Compartment());

  useEffect(() => {
    if (autoFocus && viewRef.current) {
      viewRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      history(),
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      ...editorTheme,
      EditorView.domEventHandlers({
        paste: (event, view) => {
          const text = event.clipboardData?.getData("text/plain");
          if (!text) return;

          // distinct check for legacy checklist pattern: starts with optional space, then [ ] or [x]
          if (/^\s*\[[ x]\]/m.test(text)) {
            const newText = text
              .split("\n")
              .map((line) => {
                // Replace "[ ]" or "[x]" with "- [ ]" or "- [x]", preserving indentation
                return line.replace(/^(\s*)\[([ x])\]/, "$1- [$2]");
              })
              .join("\n");

            if (newText !== text) {
              event.preventDefault();
              view.dispatch(view.state.replaceSelection(newText));
            }
          }
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorView.lineWrapping,
      fontSizeCompartment.current.of(
        EditorView.theme({
          "& .cm-content": { fontSize: `${fontSize}px` },
        })
      ),
      fontFamilyCompartment.current.of(
        EditorView.theme({
          "& .cm-content": { fontFamily: fontFamily },
        })
      ),
    ];

    if (vimMode) {
      extensions.push(vim());
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    if (autoFocus) {
      setTimeout(() => view.focus(), 10);
    }

    return () => {
      view.destroy();
    };
  }, [vimMode]); // Re-create editor when vimMode changes

  // Update editor content if value prop changes externally
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontSizeCompartment.current.reconfigure(
          EditorView.theme({
            "& .cm-content": { fontSize: `${fontSize}px` },
          })
        ),
      });
    }
  }, [fontSize]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontFamilyCompartment.current.reconfigure(
          EditorView.theme({
            "& .cm-content": { fontFamily: fontFamily },
          })
        ),
      });
    }
  }, [fontFamily]);

  return <div ref={editorRef} className="h-full w-full" />;
};
