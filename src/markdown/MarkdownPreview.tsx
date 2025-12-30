import React, { useEffect, useRef } from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
// @ts-ignore
import mdKatex from "markdown-it-katex";
// @ts-ignore
import taskLists from "markdown-it-task-lists";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return "";
  },
});

md.use(mdKatex);
md.use(taskLists, { enabled: true, label: true, labelAfter: true });

export const MarkdownPreview: React.FC<{
  content: string;
  onContentChange?: (newContent: string) => void;
  fontSize?: number;
  fontFamily?: string;
}> = ({ content, onContentChange, fontSize = 16, fontFamily }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      mermaid.contentLoaded();
      const mermaidDivs =
        containerRef.current.querySelectorAll(".language-mermaid");
      mermaidDivs.forEach(async (div, i) => {
        const id = `mermaid-${i}`;
        const source = div.textContent || "";
        try {
          const { svg } = await mermaid.render(id, source);
          div.innerHTML = svg;
          div.classList.remove("language-mermaid");
          div.classList.add("mermaid-rendered");
        } catch (e) {
          console.error("Mermaid render error:", e);
        }
      });
    }
  }, [content]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    if (!onContentChange) return;

    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" &&
      (target as HTMLInputElement).type === "checkbox"
    ) {
      const checkboxes = containerRef.current?.querySelectorAll(
        'input[type="checkbox"].task-list-item-checkbox'
      );
      if (!checkboxes) return;

      const index = Array.from(checkboxes).indexOf(target as HTMLInputElement);
      if (index === -1) return;

      let counter = 0;
      // Match standard Markdown task list syntax: - [ ] or * [ ] or + [ ] at start of line
      const updatedContent = content.replace(
        /^(\s*[-+*]\s*)\[([ x])\]/gm,
        (match, prefix, state) => {
          if (counter === index) {
            const newState = state === " " ? "x" : " ";
            counter++;
            return `${prefix}[${newState}]`;
          }
          counter++;
          return match;
        }
      );

      if (updatedContent !== content) {
        onContentChange(updatedContent);
      }
    }
  };

  const html = md.render(content);

  return (
    <div className="w-full flex justify-center px-6">
      <div className="w-full max-w-4xl bg-[#0f0f10] border border-neutral-800 rounded-lg shadow-sm transition-colors duration-200 overflow-hidden">
        <div
          ref={containerRef}
          onClick={handleCheckboxClick}
          className={`prose prose-invert max-w-none p-6 markdown-prose
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-neutral-300 prose-p:leading-relaxed
            prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 hover:prose-a:underline
            prose-strong:text-white prose-strong:font-bold
            prose-code:text-purple-300 prose-code:bg-neutral-800/50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[#0b0b0b] prose-pre:border prose-pre:border-neutral-800 prose-pre:rounded prose-pre:p-4 prose-pre:shadow-sm
            prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-neutral-800/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
            prose-li:text-neutral-300 prose-li:mb-2
            prose-img:rounded-lg prose-img:shadow-lg [&>:not(pre)]:text-[1em] marker:text-neutral-500`}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            transition: "font-size 180ms ease, font-family 200ms ease",
          }}
        />
      </div>
    </div>
  );
};
