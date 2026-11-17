import React, { useState } from 'react';
import { BubbleMenu, type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link2,
  Code,
  Sparkles,
  ChevronDown,
  Undo2,
  Redo2,
  PlusSquare,
  Trash2,
  Rows,
  Columns,
  Unlink
} from 'lucide-react';
import type { SelectionRangeText } from './editorTypes';

interface ArticleFormattingToolbarProps {
  editor: Editor | null;
  onOpenLinkModal: () => void;
  onAiSelectionAction: (task: string, selection: SelectionRangeText) => void;
  onOpenBlockInserter?: () => void;
}

const HEADING_OPTIONS = [
  { value: 'paragraph', label: 'Paragraf' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'blockquote', label: 'Kutipan' }
] as const;

const AI_SELECTION_ACTIONS = [
  { task: 'improve_selection', label: 'Perbaiki Paragraf' },
  { task: 'rewrite_selection', label: 'Tulis Ulang Lebih Segar' },
  { task: 'expand_selection', label: 'Kembangkan Penjelasan' },
  { task: 'summarize_selection', label: 'Ringkas Paragraf' },
  { task: 'fix_grammar', label: 'Perbaiki Tata Bahasa / EYD' },
  { task: 'improve_readability_selection', label: 'Tingkatkan Keterbacaan' },
  { task: 'generate_heading_selection', label: 'Sarankan Subheading' }
];

export const ArticleFormattingToolbar: React.FC<ArticleFormattingToolbarProps> = ({
  editor,
  onOpenLinkModal,
  onAiSelectionAction,
  onOpenBlockInserter
}) => {
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  if (!editor) return null;

  const currentBlockValue = editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
      ? 'h3'
      : editor.isActive('heading', { level: 4 })
        ? 'h4'
        : editor.isActive('blockquote')
          ? 'blockquote'
          : 'paragraph';

  const applyBlockType = (val: string) => {
    const chain = editor.chain().focus();
    if (val === 'h2') chain.setHeading({ level: 2 }).run();
    else if (val === 'h3') chain.setHeading({ level: 3 }).run();
    else if (val === 'h4') chain.setHeading({ level: 4 }).run();
    else if (val === 'blockquote') chain.toggleBlockquote().run();
    else chain.setParagraph().run();
  };

  const triggerAiOnSelection = (task: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '\n').trim();
    if (!selectedText) return;
    setShowAiMenu(false);
    onAiSelectionAction(task, { from, to, text: selectedText });
  };

  const isInTable = editor.isActive('table');

  return (
    <>
      {/* FLOATING SELECTION BUBBLE MENU (Gutenberg-like inline toolbar) */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 130, maxWidth: 560, placement: 'top' }}
        shouldShow={({ editor: ed, state }) => {
          const { empty, from, to } = state.selection;
          if (empty) return false;
          if (ed.isActive('figureImage') || ed.isActive('ctaButton') || ed.isActive('embedBlock') || ed.isActive('galleryBlock') || ed.isActive('customHtmlBlock')) {
            return false;
          }
          return state.doc.textBetween(from, to, ' ').trim().length > 0;
        }}
        className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl text-zinc-700 dark:text-zinc-200"
      >
        <select
          value={currentBlockValue}
          onChange={(e) => applyBlockType(e.target.value)}
          className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold border border-transparent hover:border-zinc-200 focus:outline-none cursor-pointer"
        >
          {HEADING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded-lg ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded-lg ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
          className={`p-1.5 rounded-lg ${editor.isActive('underline') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Underline size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          className={`p-1.5 rounded-lg ${editor.isActive('strike') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Strikethrough size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
          className={`p-1.5 rounded-lg ${editor.isActive('code') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Code size={14} />
        </button>

        <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={onOpenLinkModal}
          title="Tautan (Ctrl+K)"
          className={`p-1.5 rounded-lg ${editor.isActive('link') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Link2 size={14} />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Hapus Tautan"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
          >
            <Unlink size={14} />
          </button>
        )}

        <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

        {/* Selected Text AI Actions Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAiMenu((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold"
          >
            <Sparkles size={13} />
            AI Perbaiki
            <ChevronDown size={11} />
          </button>

          {showAiMenu && (
            <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl py-1 z-50">
              {AI_SELECTION_ACTIONS.map((act) => (
                <button
                  key={act.task}
                  type="button"
                  onClick={() => triggerAiOnSelection(act.task)}
                  className="w-full px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700"
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </BubbleMenu>

      {/* SUBTLE STICKY FORMATTING STRIP (Always accessible on touch/mobile & desktop without clutter) */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200/80 dark:border-zinc-800 px-3 sm:px-6 py-1.5 flex flex-wrap items-center gap-1 text-zinc-600 dark:text-zinc-300">
        <select
          value={currentBlockValue}
          onChange={(e) => applyBlockType(e.target.value)}
          aria-label="Jenis Block"
          className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {HEADING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Underline size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Strikethrough size={14} />
        </button>

        <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Kutipan"
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Quote size={14} />
        </button>

        {/* Alignment Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlignMenu((v) => !v)}
            title="Perataan Teks"
            className="inline-flex items-center gap-0.5 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {editor.isActive({ textAlign: 'center' }) ? (
              <AlignCenter size={14} />
            ) : editor.isActive({ textAlign: 'right' }) ? (
              <AlignRight size={14} />
            ) : (
              <AlignLeft size={14} />
            )}
            <ChevronDown size={11} />
          </button>

          {showAlignMenu && (
            <div className="absolute left-0 mt-1 p-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg flex items-center gap-1 z-40">
              {(['left', 'center', 'right'] as const).map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setTextAlign(al).run();
                    setShowAlignMenu(false);
                  }}
                  className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: al }) ? 'bg-blue-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  {al === 'left' ? <AlignLeft size={14} /> : al === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenLinkModal}
          title="Sisipkan Link (Ctrl+K)"
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Link2 size={14} />
        </button>

        {/* Mobile Undo/Redo */}
        <div className="sm:hidden flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded-lg disabled:opacity-30"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded-lg disabled:opacity-30"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Contextual Table Row/Col Controls only visible when cursor is inside a Table */}
        {isInTable && (
          <div className="flex items-center gap-1 ml-1 pl-2 border-l border-zinc-200 dark:border-zinc-700 text-[11px]">
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 hover:text-blue-700 font-medium"
            >
              <Rows size={12} /> +Baris
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 hover:text-blue-700 font-medium"
            >
              <Columns size={12} /> +Kolom
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-2 py-1 rounded-md hover:bg-rose-50 text-rose-600"
              title="Hapus Baris"
            >
              -Baris
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="p-1 rounded-md hover:bg-rose-50 text-rose-600"
              title="Hapus Tabel"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {onOpenBlockInserter && (
          <button
            type="button"
            onClick={onOpenBlockInserter}
            className="ml-auto hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-semibold transition-colors"
          >
            <PlusSquare size={13} /> Tambah Block ( / )
          </button>
        )}
      </div>
    </>
  );
};

