import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Tema escuro customizado
const coral = "#e06c75",
  cyan = "#56b6c2",
  invalid = "#ffffff",
  ivory = "#abb2bf",
  stone = "#7d8799", // Comments
  malibu = "#61afef",
  sage = "#98c379",
  whiskey = "#d19a66",
  violet = "#c678dd",
  darkBackground = "#0b0b0b",
  background = "#0b0b0b",
  selection = "#2a2a2a",
  cursor = "#a855f7"; // Purple-500

export const editorDarkTheme = EditorView.theme(
  {
    "&": {
      color: ivory,
      backgroundColor: background,
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
    },

    ".cm-content": {
      caretColor: cursor,
      fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
      minHeight: "100%",
    },

    ".cm-scroller": {
      fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
      fontSize: "14px",
      overflow: "auto",
      flex: "1",
      width: "100%",
    },

    /* Cursor */
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: cursor,
    },

    /* Linha ativa */
    ".cm-activeLine": {
      backgroundColor: "#111111",
    },

    /* Seleção */
    ".cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: selection + " !important",
    },

    ".cm-focused .cm-selectionBackground": {
      backgroundColor: selection + " !important",
    },

    /* Search match */
    ".cm-searchMatch": {
      backgroundColor: "#72a1ff59",
      outline: "1px solid #457dff",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#6199ff2f",
    },

    /* Gutters */
    ".cm-gutters": {
      backgroundColor: background,
      color: stone,
      border: "none",
      minHeight: "100%",
    },

    ".cm-activeLineGutter": {
      backgroundColor: "#111111",
      color: ivory,
    },

    /* Panels */
    ".cm-panels": { backgroundColor: darkBackground, color: ivory },
    ".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
    ".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },
  },
  { dark: true }
);

/// The highlighting style for code.
export const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: violet },
  {
    tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: coral,
  },
  { tag: [t.function(t.variableName), t.labelName], color: malibu },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
  { tag: [t.definition(t.name), t.separator], color: ivory },
  {
    tag: [
      t.typeName,
      t.className,
      t.number,
      t.changed,
      t.annotation,
      t.modifier,
      t.self,
      t.namespace,
    ],
    color: whiskey,
  },
  {
    tag: [
      t.operator,
      t.operatorKeyword,
      t.url,
      t.escape,
      t.regexp,
      t.link,
      t.special(t.string),
    ],
    color: cyan,
  },
  { tag: [t.meta, t.comment], color: stone },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: stone, textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: coral },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: whiskey },
  { tag: [t.processingInstruction, t.string, t.inserted], color: sage },
  { tag: t.invalid, color: invalid },
]);

export const editorTheme = [
  editorDarkTheme,
  syntaxHighlighting(highlightStyle),
];
