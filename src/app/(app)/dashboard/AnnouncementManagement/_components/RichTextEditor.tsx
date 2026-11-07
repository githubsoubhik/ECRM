"use client";

// Lightweight rich-text editor for the announcement message.
// Uses the browser's built-in editing (contentEditable), so no extra package is needed.

import { useEffect, useRef, useState } from "react";
import { Bold, ChevronDown, Italic, Link2, List, ListOrdered, Smile, Underline } from "lucide-react";
import { cx, useDismiss } from "./ui";
import styles from "../announcement.module.css";

const EMOJIS = ["😀", "😊", "🎉", "👏", "🙏", "👍", "🎊", "🪔", "📢", "📌", "📅", "⏰", "✅", "⚠️", "❗", "💡", "🏆", "💼", "📝", "📎", "🎂", "☕", "🌟", "❤️"];

type Mark = "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList";

export default function RichTextEditor({
  initialHtml,
  onChange,
  placeholder,
  invalid,
  id,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder: string;
  invalid?: boolean;
  id?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<Mark, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const [block, setBlock] = useState("p");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [empty, setEmpty] = useState(!initialHtml);
  const emojiRef = useDismiss<HTMLDivElement>(emojiOpen, () => setEmojiOpen(false));

  // Load the starting content ONCE when the editor mounts. It must not re-run while typing,
  // otherwise the content is replaced on every keystroke and the cursor jumps to the start.
  // (The parent remounts the editor via `key` to load a template or draft.)
  const initial = useRef(initialHtml);
  useEffect(() => {
    if (box.current) box.current.innerHTML = initial.current;
  }, []);

  // Keep the toolbar's pressed state in sync with the cursor.
  useEffect(() => {
    const update = () => {
      const sel = document.getSelection();
      if (!box.current || !sel || !box.current.contains(sel.anchorNode)) return;
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
      const b = String(document.queryCommandValue("formatBlock") || "p").toLowerCase();
      setBlock(b === "h3" || b === "h4" ? b : "p");
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  const emit = () => {
    const html = box.current?.innerHTML ?? "";
    const text = box.current?.textContent?.trim() ?? "";
    setEmpty(!text && !/<(li|img)/i.test(html));
    onChange(text ? html : "");
  };

  const run = (cmd: string, value?: string) => {
    box.current?.focus();
    document.execCommand(cmd, false, value);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link address (https://…)", "https://");
    if (!url || !/^(https?:\/\/|mailto:)/i.test(url)) return;
    const sel = document.getSelection();
    if (sel && sel.isCollapsed) run("insertHTML", `<a href="${url.replace(/"/g, "&quot;")}">${url.replace(/</g, "&lt;")}</a>`);
    else run("createLink", url);
  };

  const tool = (mark: Mark, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      className={cx(styles.tool, active[mark] && styles.toolOn)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => run(mark)}
      aria-label={label}
      aria-pressed={active[mark]}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className={cx(styles.editor, invalid && styles.invalid)}>
      <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
        <label className={styles.blockSelect}>
          <select value={block} onChange={(e) => run("formatBlock", e.target.value)} aria-label="Text style">
            <option value="p">Normal</option>
            <option value="h3">Heading</option>
            <option value="h4">Subheading</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <span className={styles.toolGap} />
        {tool("bold", <Bold size={16} strokeWidth={2.6} />, "Bold")}
        {tool("italic", <Italic size={16} />, "Italic")}
        {tool("underline", <Underline size={16} />, "Underline")}
        <span className={styles.toolGap} />
        {tool("insertUnorderedList", <List size={17} />, "Bulleted list")}
        {tool("insertOrderedList", <ListOrdered size={17} />, "Numbered list")}
        <span className={styles.toolGap} />
        <button type="button" className={styles.tool} onMouseDown={(e) => e.preventDefault()} onClick={addLink} aria-label="Insert link" title="Insert link">
          <Link2 size={17} />
        </button>
        <div className={styles.emojiWrap} ref={emojiRef}>
          <button
            type="button"
            className={cx(styles.tool, emojiOpen && styles.toolOn)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setEmojiOpen((o) => !o)}
            aria-label="Insert emoji"
            title="Insert emoji"
          >
            <Smile size={17} />
          </button>
          {emojiOpen && (
            <div className={styles.emojiPop}>
              {EMOJIS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    run("insertText", em);
                    setEmojiOpen(false);
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        id={id}
        ref={box}
        className={cx(styles.editArea, empty && styles.editEmpty)}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Message"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // Paste as plain text so outside styles don't come along.
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          emit();
        }}
      />
    </div>
  );
}
