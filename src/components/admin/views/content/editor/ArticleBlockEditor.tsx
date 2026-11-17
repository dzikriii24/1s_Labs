import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Code2,
  X,
  Check,
  Loader2,
  Repeat2
} from 'lucide-react';
import { BLOCK_CATEGORY_LABELS, BLOCK_DEFINITIONS, type BlockCategory } from './blockDefinitions';
import type { SelectionRangeText } from './editorTypes';

interface TopBlockInfo {
  index: number;
  pos: number;
  endPos: number;
  node: ProseMirrorNode;
  dom: HTMLElement;
}

interface ArticleBlockEditorProps {
  editor: Editor | null;
  title: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt: string;
  featuredImageCaption: string;
  htmlSourceMode: boolean;
  htmlContent: string;
  aiAltLoading: boolean;
  onChangeTitle: (value: string) => void;
  onChangeExcerpt: (value: string) => void;
  onChangeFeaturedAlt: (value: string) => void;
  onChangeFeaturedCaption: (value: string) => void;
  onRemoveFeaturedImage: () => void;
  onOpenFeaturedMedia: () => void;
  onUploadFeaturedFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateFeaturedAiAlt: () => void;
  onChangeHtmlContent: (value: string) => void;
  onToggleVisualMode: () => void;
  onOpenMediaInline: () => void;
  onOpenTableModal: () => void;
  onRunAiTask: (task: string) => void;
  onAiImproveBlock: (selection: SelectionRangeText) => void;
  externalOpenInserterTick?: number;
}

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export const ArticleBlockEditor: React.FC<ArticleBlockEditorProps> = ({
  editor,
  title,
  excerpt,
  featuredImage,
  featuredImageAlt,
  featuredImageCaption,
  htmlSourceMode,
  htmlContent,
  aiAltLoading,
  onChangeTitle,
  onChangeExcerpt,
  onChangeFeaturedAlt,
  onChangeFeaturedCaption,
  onRemoveFeaturedImage,
  onOpenFeaturedMedia,
  onUploadFeaturedFile,
  onGenerateFeaturedAiAlt,
  onChangeHtmlContent,
  onToggleVisualMode,
  onOpenMediaInline,
  onOpenTableModal,
  onRunAiTask,
  onAiImproveBlock,
  externalOpenInserterTick = 0
}) => {
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const excerptRef = useRef<HTMLTextAreaElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  const [editingFeaturedAlt, setEditingFeaturedAlt] = useState(false);

  // Active / hovered top-level block gutter state
  const [activeBlock, setActiveBlock] = useState<{
    index: number;
    pos: number;
    endPos: number;
    top: number;
    nodeType: string;
    totalBlocks: number;
  } | null>(null);

  const [blockActionMenuOpen, setBlockActionMenuOpen] = useState(false);
  const [inlineInserterState, setInlineInserterState] = useState<{
    open: boolean;
    insertPos?: number;
    query: string;
  }>({ open: false, query: '' });

  // Drag-and-drop state
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ insertIdx: number; lineTop: number } | null>(null);

  // Slash command menu state
  const [slashState, setSlashState] = useState<{
    open: boolean;
    query: string;
    from: number;
    to: number;
    coords: { top: number; left: number };
    selectedIndex: number;
  }>({
    open: false,
    query: '',
    from: 0,
    to: 0,
    coords: { top: 0, left: 0 },
    selectedIndex: 0
  });

  useEffect(() => {
    autoResizeTextarea(titleRef.current);
  }, [title]);

  useEffect(() => {
    autoResizeTextarea(excerptRef.current);
  }, [excerpt]);

  useEffect(() => {
    if (externalOpenInserterTick > 0) {
      setInlineInserterState({ open: true, insertPos: undefined, query: '' });
    }
  }, [externalOpenInserterTick]);

  // Helper: list all top-level ProseMirror blocks with resolved DOM nodes
  const getTopLevelBlocks = useCallback((): TopBlockInfo[] => {
    if (!editor || htmlSourceMode) return [];
    const doc = editor.state.doc;
    const blocks: TopBlockInfo[] = [];
    let offset = 0;
    for (let i = 0; i < doc.childCount; i++) {
      const child = doc.child(i);
      const domNode = editor.view.nodeDOM(offset);
      if (domNode instanceof HTMLElement) {
        blocks.push({
          index: i,
          pos: offset,
          endPos: offset + child.nodeSize,
          node: child,
          dom: domNode
        });
      }
      offset += child.nodeSize;
    }
    return blocks;
  }, [editor, htmlSourceMode]);

  // Sync slash command trigger `/` as user types or moves cursor
  useEffect(() => {
    if (!editor || htmlSourceMode) {
      setSlashState((s) => (s.open ? { ...s, open: false } : s));
      return;
    }

    const handleUpdateOrSelection = () => {
      const { state, view } = editor;
      const { selection } = state;
      if (!selection.empty) {
        setSlashState((s) => (s.open ? { ...s, open: false } : s));
        return;
      }

      const $from = selection.$from;
      if ($from.parent.type.name === 'codeBlock') {
        setSlashState((s) => (s.open ? { ...s, open: false } : s));
        return;
      }

      const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
      const slashMatch = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9-]*)$/);

      if (slashMatch) {
        const query = slashMatch[1] || '';
        const slashOffset = slashMatch[0].startsWith(' ') ? slashMatch[0].length - 1 : slashMatch[0].length;
        const from = selection.from - slashOffset;
        const to = selection.from;

        const coords = view.coordsAtPos(selection.from);
        const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
        const relTop = wrapperRect ? coords.bottom - wrapperRect.top + 8 : coords.bottom + 8;
        const relLeft = wrapperRect ? Math.max(0, coords.left - wrapperRect.left) : coords.left;

        setSlashState((prev) => ({
          open: true,
          query,
          from,
          to,
          coords: { top: relTop, left: Math.min(relLeft, 360) },
          selectedIndex: prev.query === query ? prev.selectedIndex : 0
        }));
      } else {
        setSlashState((s) => (s.open ? { ...s, open: false } : s));
      }

      // Sync active block gutter on cursor move
      if ($from.depth >= 1) {
        const blockPos = $from.before(1);
        const domEl = view.nodeDOM(blockPos);
        const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
        if (domEl instanceof HTMLElement && wrapperRect) {
          const rect = domEl.getBoundingClientRect();
          const blocks = getTopLevelBlocks();
          const idx = blocks.findIndex((b) => b.pos === blockPos);
          if (idx !== -1) {
            setActiveBlock({
              index: idx,
              pos: blockPos,
              endPos: blocks[idx].endPos,
              top: rect.top - wrapperRect.top,
              nodeType: blocks[idx].node.type.name,
              totalBlocks: blocks.length
            });
          }
        }
      }
    };

    editor.on('update', handleUpdateOrSelection);
    editor.on('selectionUpdate', handleUpdateOrSelection);
    return () => {
      editor.off('update', handleUpdateOrSelection);
      editor.off('selectionUpdate', handleUpdateOrSelection);
    };
  }, [editor, htmlSourceMode, getTopLevelBlocks]);

  const filteredSlashItems = BLOCK_DEFINITIONS.filter((def) => {
    const q = slashState.query.trim().toLowerCase();
    if (!q) return true;
    return (
      def.label.toLowerCase().includes(q) ||
      def.keywords.some((k) => k.includes(q)) ||
      def.description.toLowerCase().includes(q)
    );
  });

  const executeSlashItem = (idx: number) => {
    if (!editor) return;
    const item = filteredSlashItems[idx];
    if (!item) return;

    const { from, to } = slashState;
    editor.chain().focus().deleteRange({ from, to }).run();
    setSlashState((s) => ({ ...s, open: false }));

    item.execute({
      editor,
      openMediaInline: onOpenMediaInline,
      openTableModal: onOpenTableModal,
      runAiTask: onRunAiTask
    });
  };

  // Keyboard intercept inside editor for Slash Command Menu (ArrowUp/Down/Enter/Escape)
  const handleCanvasKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!slashState.open || filteredSlashItems.length === 0) {
      if (slashState.open && e.key === 'Escape') {
        e.preventDefault();
        setSlashState((s) => ({ ...s, open: false }));
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setSlashState((s) => ({ ...s, selectedIndex: (s.selectedIndex + 1) % filteredSlashItems.length }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setSlashState((s) => ({
        ...s,
        selectedIndex: (s.selectedIndex - 1 + filteredSlashItems.length) % filteredSlashItems.length
      }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      executeSlashItem(slashState.selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setSlashState((s) => ({ ...s, open: false }));
    }
  };

  // Track hovered top-level block cleanly via mousemove over ProseMirror canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor || htmlSourceMode || blockActionMenuOpen || draggedBlockIdx !== null) return;
    const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;

    const blocks = getTopLevelBlocks();
    for (const b of blocks) {
      const rect = b.dom.getBoundingClientRect();
      if (e.clientY >= rect.top - 6 && e.clientY <= rect.bottom + 6) {
        if (activeBlock?.pos !== b.pos) {
          setActiveBlock({
            index: b.index,
            pos: b.pos,
            endPos: b.endPos,
            top: rect.top - wrapperRect.top,
            nodeType: b.node.type.name,
            totalBlocks: blocks.length
          });
        }
        return;
      }
    }
  };

  // Atomic ProseMirror block reorder helper
  const moveBlock = (fromIdx: number, insertIdx: number) => {
    if (!editor) return;
    const blocks = getTopLevelBlocks();
    const sourceBlock = blocks[fromIdx];
    if (!sourceBlock) return;
    if (insertIdx === fromIdx || insertIdx === fromIdx + 1) return;

    const boundedInsertIdx = Math.max(0, Math.min(blocks.length, insertIdx));
    const targetRawPos =
      boundedInsertIdx >= blocks.length ? blocks[blocks.length - 1].endPos : blocks[boundedInsertIdx].pos;

    const copiedNode = editor.state.schema.nodeFromJSON(sourceBlock.node.toJSON());
    const tr = editor.state.tr;
    tr.delete(sourceBlock.pos, sourceBlock.endPos);
    const mappedTarget = tr.mapping.map(targetRawPos);
    tr.insert(mappedTarget, copiedNode);
    editor.view.dispatch(tr);
  };

  const handleDuplicateActiveBlock = () => {
    if (!editor || !activeBlock) return;
    const blocks = getTopLevelBlocks();
    const b = blocks[activeBlock.index];
    if (!b) return;
    editor.chain().focus().insertContentAt(b.endPos, b.node.toJSON()).run();
    setBlockActionMenuOpen(false);
  };

  const handleDeleteActiveBlock = () => {
    if (!editor || !activeBlock) return;
    const blocks = getTopLevelBlocks();
    const b = blocks[activeBlock.index];
    if (!b) return;
    if (blocks.length <= 1) {
      editor.chain().focus().clearContent().run();
    } else {
      editor.chain().focus().deleteRange({ from: b.pos, to: b.endPos }).run();
    }
    setBlockActionMenuOpen(false);
    setActiveBlock(null);
  };

  const handleConvertActiveBlock = (targetType: string) => {
    if (!editor || !activeBlock) return;
    const blocks = getTopLevelBlocks();
    const b = blocks[activeBlock.index];
    if (!b) return;

    const innerPos = Math.min(b.pos + 1, editor.state.doc.content.size);
    const chain = editor.chain().focus().setTextSelection(innerPos);

    if (targetType === 'paragraph') chain.setParagraph().run();
    else if (targetType === 'h2') chain.setHeading({ level: 2 }).run();
    else if (targetType === 'h3') chain.setHeading({ level: 3 }).run();
    else if (targetType === 'h4') chain.setHeading({ level: 4 }).run();
    else if (targetType === 'blockquote') chain.toggleBlockquote().run();
    else if (targetType === 'bulletList') chain.toggleBulletList().run();
    else if (targetType === 'orderedList') chain.toggleOrderedList().run();
    else if (targetType === 'codeBlock') chain.toggleCodeBlock().run();
    else if (targetType === 'calloutBox') {
      const txt = b.node.textContent || 'Catatan Praktis 1sLabs: ...';
      editor
        .chain()
        .focus()
        .deleteRange({ from: b.pos, to: b.endPos })
        .insertContentAt(b.pos, {
          type: 'calloutBox',
          attrs: { tone: 'info' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: txt }] }]
        })
        .run();
    }

    setBlockActionMenuOpen(false);
  };

  const handleAiActiveBlock = () => {
    if (!editor || !activeBlock) return;
    const blocks = getTopLevelBlocks();
    const b = blocks[activeBlock.index];
    if (!b) return;
    const text = b.node.textContent.trim();
    if (!text) return;
    setBlockActionMenuOpen(false);
    onAiImproveBlock({ from: b.pos, to: b.endPos, text });
  };

  // Drag-and-drop handlers over canvas
  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedBlockIdx === null || !editor) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;
    const blocks = getTopLevelBlocks();
    if (blocks.length === 0) return;

    let chosenIdx = blocks.length;
    let lineTop = blocks[blocks.length - 1].dom.getBoundingClientRect().bottom - wrapperRect.top + 4;

    for (let i = 0; i < blocks.length; i++) {
      const rect = blocks[i].dom.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        chosenIdx = i;
        lineTop = rect.top - wrapperRect.top - 4;
        break;
      }
    }

    setDropTarget({ insertIdx: chosenIdx, lineTop });
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedBlockIdx === null) return;
    e.preventDefault();
    if (dropTarget) {
      moveBlock(draggedBlockIdx, dropTarget.insertIdx);
    }
    setDraggedBlockIdx(null);
    setDropTarget(null);
  };

  return (
    <div className="max-w-[760px] mx-auto w-full px-4 sm:px-8 pt-8 pb-28">
      {/* ARTICLE TITLE (H1 - Seamless Paper Feel) */}
      <div className="mb-3">
        <textarea
          ref={titleRef}
          rows={1}
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              excerptRef.current?.focus();
            }
          }}
          placeholder="Tulis judul artikel di sini..."
          className="w-full resize-none overflow-hidden bg-transparent text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 leading-tight focus:outline-none"
        />
      </div>

      {/* SUBTITLE / EXCERPT */}
      <div className="mb-6">
        <textarea
          ref={excerptRef}
          rows={1}
          value={excerpt}
          onChange={(e) => onChangeExcerpt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              editor?.commands.focus();
            }
          }}
          placeholder="Tambahkan ringkasan pembuka atau subjudul artikel (opsional)..."
          className="w-full resize-none overflow-hidden bg-transparent text-base sm:text-lg text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 leading-relaxed focus:outline-none"
        />
      </div>

      {/* FEATURED IMAGE BLOCK ON CANVAS */}
      <div className="mb-8">
        {featuredImage ? (
          <figure className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <img
              src={featuredImage}
              alt={featuredImageAlt || title || 'Featured image'}
              className="w-full max-h-[380px] object-cover block"
            />
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={onOpenFeaturedMedia}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-100 text-xs font-semibold shadow-md border border-zinc-200/80 dark:border-zinc-700 hover:bg-white"
              >
                <RefreshCw size={12} /> Ganti Gambar
              </button>
              <button
                type="button"
                onClick={() => setEditingFeaturedAlt((v) => !v)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-md border ${
                  !featuredImageAlt
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-white/95 text-zinc-800 border-zinc-200/80'
                }`}
              >
                Alt Text {!featuredImageAlt && '· Kosong'}
              </button>
              <button
                type="button"
                onClick={onRemoveFeaturedImage}
                className="p-1.5 rounded-lg bg-rose-600 text-white shadow-md hover:bg-rose-700"
                title="Hapus Featured Image"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {editingFeaturedAlt && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-zinc-500">Alt Text:</span>
                <input
                  type="text"
                  value={featuredImageAlt}
                  onChange={(e) => onChangeFeaturedAlt(e.target.value)}
                  placeholder="Deskripsi visual untuk screen reader & SEO..."
                  className="flex-1 min-w-[200px] px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                />
                <button
                  type="button"
                  disabled={aiAltLoading}
                  onClick={onGenerateFeaturedAiAlt}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold"
                >
                  {aiAltLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI Alt Text
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFeaturedAlt(false)}
                  className="p-1 rounded-lg bg-blue-600 text-white"
                >
                  <Check size={13} />
                </button>
              </div>
            )}

            <div className="px-4 py-2 bg-zinc-50/70 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <input
                type="text"
                value={featuredImageCaption}
                onChange={(e) => onChangeFeaturedCaption(e.target.value)}
                placeholder="Tambahkan keterangan gambar sampul (opsional)..."
                className="w-full text-center bg-transparent text-xs text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </figure>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenFeaturedMedia}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/40 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-700 transition-colors"
            >
              <ImageIcon size={14} className="text-blue-600" />
              Tambah Gambar Sampul
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-xs font-medium text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors">
              <Upload size={13} />
              Upload Cepat
              <input type="file" accept="image/*" onChange={onUploadFeaturedFile} className="hidden" />
            </label>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200/70 dark:border-zinc-800 mb-6" />

      {/* MAIN WRITING CANVAS: BLOCK EDITOR OR HTML SOURCE */}
      {htmlSourceMode ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
              <Code2 size={14} className="text-blue-600" /> Mode Kode HTML Artikel
            </span>
            <button
              type="button"
              onClick={onToggleVisualMode}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Kembali ke Editor Visual
            </button>
          </div>
          <textarea
            rows={22}
            value={htmlContent}
            onChange={(e) => onChangeHtmlContent(e.target.value)}
            className="w-full p-5 font-mono text-xs bg-zinc-950 text-zinc-100 focus:outline-none leading-relaxed"
          />
        </div>
      ) : (
        <div
          ref={canvasWrapperRef}
          onMouseMove={handleCanvasMouseMove}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onDragEnd={() => {
            setDraggedBlockIdx(null);
            setDropTarget(null);
          }}
          onKeyDownCapture={handleCanvasKeyDownCapture}
          className="relative min-h-[460px] lg:pl-12"
        >
          {/* LEFT GUTENBERG BLOCK HANDLE GUTTER (Desktop/Tablet) */}
          {activeBlock && (
            <div
              style={{ top: Math.max(0, activeBlock.top) }}
              className="hidden lg:flex items-center gap-0.5 absolute left-0 z-10 select-none transition-all duration-100"
            >
              <button
                type="button"
                onClick={() =>
                  setInlineInserterState({
                    open: true,
                    insertPos: activeBlock.endPos,
                    query: ''
                  })
                }
                title="Tambah block di bawah"
                className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                <Plus size={14} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    setDraggedBlockIdx(activeBlock.index);
                    setBlockActionMenuOpen(false);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(activeBlock.index));
                  }}
                  onClick={() => setBlockActionMenuOpen((v) => !v)}
                  title="Tarik untuk geser block, atau klik untuk opsi block"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical size={14} />
                </button>

                {blockActionMenuOpen && (
                  <div className="absolute left-0 top-7 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Aksi Block
                      </span>
                      <button
                        type="button"
                        onClick={() => setBlockActionMenuOpen(false)}
                        className="text-zinc-400 hover:text-zinc-700"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={activeBlock.index === 0}
                      onClick={() => {
                        moveBlock(activeBlock.index, activeBlock.index - 1);
                        setBlockActionMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-35"
                    >
                      <ArrowUp size={13} /> Naikkan ke Atas
                    </button>
                    <button
                      type="button"
                      disabled={activeBlock.index >= activeBlock.totalBlocks - 1}
                      onClick={() => {
                        moveBlock(activeBlock.index, activeBlock.index + 2);
                        setBlockActionMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-35"
                    >
                      <ArrowDown size={13} /> Turunkan ke Bawah
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicateActiveBlock}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <Copy size={13} /> Duplikat Block
                    </button>
                    <button
                      type="button"
                      onClick={handleAiActiveBlock}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <Sparkles size={13} /> Perbaiki Block dengan AI
                    </button>

                    {!['figureImage', 'ctaButton', 'embedBlock', 'galleryBlock', 'customHtmlBlock', 'horizontalRule', 'table'].includes(
                      activeBlock.nodeType
                    ) && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1 px-3 py-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                          <Repeat2 size={10} /> Ubah Menjadi
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { id: 'paragraph', label: 'Paragraf' },
                            { id: 'h2', label: 'H2' },
                            { id: 'h3', label: 'H3' },
                            { id: 'h4', label: 'H4' },
                            { id: 'bulletList', label: 'Bullet' },
                            { id: 'orderedList', label: 'Angka' },
                            { id: 'blockquote', label: 'Quote' },
                            { id: 'calloutBox', label: 'Callout' }
                          ].map((conv) => (
                            <button
                              key={conv.id}
                              type="button"
                              onClick={() => handleConvertActiveBlock(conv.id)}
                              className="px-2 py-1 rounded-md bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 hover:text-blue-700 text-left text-[11px]"
                            >
                              {conv.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleDeleteActiveBlock}
                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-medium"
                      >
                        <Trash2 size={13} /> Hapus Block
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BLUE DRAG-DROP INDICATOR LINE */}
          {dropTarget && (
            <div
              style={{ top: dropTarget.lineTop }}
              className="absolute left-12 right-0 h-0.5 bg-blue-600 rounded-full pointer-events-none z-30 shadow-xs"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 -left-1 -top-1 absolute" />
            </div>
          )}

          {/* TIPTAP BLOCK PROSE EDITOR */}
          <EditorContent editor={editor} />

          {/* SLASH COMMAND PALETTE (`/`) */}
          {slashState.open && (
            <div
              style={{ top: slashState.coords.top, left: slashState.coords.left }}
              className="absolute w-72 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl p-1.5 z-50"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Perintah Slash {slashState.query ? `“/${slashState.query}”` : '(Pilih Block)'}
              </div>
              {filteredSlashItems.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-zinc-400">
                  Tidak ada block yang cocok.
                </div>
              ) : (
                filteredSlashItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = idx === slashState.selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeSlashItem(idx);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <span
                        className={`p-1.5 rounded-lg shrink-0 ${
                          item.category === 'ai'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold truncate">{item.label}</span>
                        <span className="block text-[10px] text-zinc-400 truncate">{item.description}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* INLINE BLOCK INSERTER MODAL/POPOVER */}
          {inlineInserterState.open && (
            <div className="fixed inset-0 z-50 bg-zinc-900/35 backdrop-blur-[1px] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <Plus size={16} className="text-blue-600 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={inlineInserterState.query}
                    onChange={(e) => setInlineInserterState((s) => ({ ...s, query: e.target.value }))}
                    placeholder="Cari block untuk disisipkan (Heading, Gambar, Tabel, Callout, CTA)..."
                    className="flex-1 bg-transparent text-xs focus:outline-none text-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setInlineInserterState({ open: false, query: '' })}
                    className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto space-y-4">
                  {(['basic', 'media', 'advanced', 'ai'] as BlockCategory[]).map((cat) => {
                    const q = inlineInserterState.query.trim().toLowerCase();
                    const defs = BLOCK_DEFINITIONS.filter(
                      (b) =>
                        b.category === cat &&
                        (!q ||
                          b.label.toLowerCase().includes(q) ||
                          b.keywords.some((k) => k.includes(q)))
                    );
                    if (defs.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          {BLOCK_CATEGORY_LABELS[cat]}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {defs.map((def) => {
                            const Icon = def.icon;
                            return (
                              <button
                                key={def.id}
                                type="button"
                                onClick={() => {
                                  if (editor) {
                                    def.execute({
                                      editor,
                                      openMediaInline: onOpenMediaInline,
                                      openTableModal: onOpenTableModal,
                                      runAiTask: onRunAiTask,
                                      insertPos: inlineInserterState.insertPos
                                    });
                                  }
                                  setInlineInserterState({ open: false, query: '' });
                                }}
                                className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 text-left transition-colors space-y-1"
                              >
                                <Icon size={16} className="text-blue-600" />
                                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                                  {def.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM QUICK APPEND BLOCK BAR */}
          <div className="mt-6 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span>Ketik <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]">/</kbd> untuk menyisipkan block cepat</span>
            <button
              type="button"
              onClick={() =>
                setInlineInserterState({
                  open: true,
                  insertPos: editor?.state.doc.content.size,
                  query: ''
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 hover:text-blue-700 font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              <Plus size={14} /> Tambah Block Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
