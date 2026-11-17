import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
  ArrowLeft,
  Plus,
  Undo2,
  Redo2,
  ListTree,
  Eye,
  Save,
  Send,
  PanelRightClose,
  PanelRightOpen,
  MoreVertical,
  History,
  Code2,
  ExternalLink,
  Copy,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { ArticleStatus } from '../../../../../services/blogApi';
import { StatusBadge } from '../blogUiUtils';
import type { AutosaveStatus } from './editorTypes';
import { formatTimeShort } from './editorTypes';
import { BLOCK_CATEGORY_LABELS, BLOCK_DEFINITIONS, type BlockCategory } from './blockDefinitions';

interface OutlineItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

interface ArticleEditorToolbarProps {
  editor: Editor | null;
  articleId: number | null;
  title: string;
  slug: string;
  status: ArticleStatus;
  hasUnsavedChanges: boolean;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: Date | null;
  saving: boolean;
  wordCount: number;
  readingTime: number;
  sidebarOpen: boolean;
  aiDrawerOpen: boolean;
  htmlSourceMode: boolean;
  onBack: () => void;
  onToggleSidebar: () => void;
  onToggleAiDrawer: () => void;
  onOpenPreview: () => void;
  onSaveDraft: () => void;
  onPublishOrUpdate: () => void;
  onOpenRevisions: () => void;
  onToggleHtmlSource: () => void;
  onCopyHtml: () => void;
  onOpenMediaInline: () => void;
  onOpenTableModal: () => void;
  onRunAiTask: (task: string) => void;
}

export const ArticleEditorToolbar: React.FC<ArticleEditorToolbarProps> = ({
  editor,
  articleId,
  title,
  slug,
  status,
  hasUnsavedChanges,
  autosaveStatus,
  lastSavedAt,
  saving,
  wordCount,
  readingTime,
  sidebarOpen,
  aiDrawerOpen,
  htmlSourceMode,
  onBack,
  onToggleSidebar,
  onToggleAiDrawer,
  onOpenPreview,
  onSaveDraft,
  onPublishOrUpdate,
  onOpenRevisions,
  onToggleHtmlSource,
  onCopyHtml,
  onOpenMediaInline,
  onOpenTableModal,
  onRunAiTask
}) => {
  const [showInserter, setShowInserter] = useState(false);
  const [inserterQuery, setInserterQuery] = useState('');
  const [showOutline, setShowOutline] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const inserterRef = useRef<HTMLDivElement | null>(null);
  const outlineRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inserterRef.current && !inserterRef.current.contains(target)) setShowInserter(false);
      if (outlineRef.current && !outlineRef.current.contains(target)) setShowOutline(false);
      if (moreRef.current && !moreRef.current.contains(target)) setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Build live Document Outline from ProseMirror doc
  const outlineItems: OutlineItem[] = [];
  if (editor && !htmlSourceMode) {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const txt = node.textContent.trim();
        if (txt) {
          outlineItems.push({
            id: `${pos}-${txt.slice(0, 16)}`,
            level: Number(node.attrs.level) || 2,
            text: txt,
            pos
          });
        }
      }
    });
  }

  const filteredDefs = BLOCK_DEFINITIONS.filter((b) => {
    const q = inserterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      b.label.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.keywords.some((k) => k.includes(q))
    );
  });

  const categoriesOrder: BlockCategory[] = ['basic', 'media', 'advanced', 'ai'];

  const renderAutosaveIndicator = () => {
    if (saving || autosaveStatus === 'saving') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
          <Loader2 size={12} className="animate-spin" />
          <span className="hidden sm:inline">Menyimpan...</span>
        </span>
      );
    }
    if (autosaveStatus === 'error') {
      return (
        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:underline"
          title="Gagal autosave — klik untuk coba simpan ulang"
        >
          <AlertCircle size={12} />
          <span className="hidden sm:inline">Gagal simpan · Coba lagi</span>
        </button>
      );
    }
    if (hasUnsavedChanges || autosaveStatus === 'unsaved') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          <Clock size={12} />
          <span className="hidden md:inline">Perubahan belum tersimpan</span>
        </span>
      );
    }
    if (lastSavedAt || autosaveStatus === 'saved') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="hidden sm:inline">
            Tersimpan otomatis {lastSavedAt ? formatTimeShort(lastSavedAt) : ''}
          </span>
        </span>
      );
    }
    return null;
  };

  return (
    <header className="h-14 shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 flex items-center justify-between gap-2 z-30">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <button
          type="button"
          onClick={onBack}
          title="Kembali ke Daftar Artikel"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Artikel</span>
        </button>

        {/* Block Inserter Toggle */}
        {!htmlSourceMode && (
          <div className="relative" ref={inserterRef}>
            <button
              type="button"
              onClick={() => setShowInserter((v) => !v)}
              title="Sisipkan Block (+)"
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                showInserter
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              <Plus size={16} />
            </button>

            {showInserter && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl p-3 z-50">
                <input
                  type="text"
                  autoFocus
                  value={inserterQuery}
                  onChange={(e) => setInserterQuery(e.target.value)}
                  placeholder="Cari block (heading, gambar, tabel, callout)..."
                  className="w-full px-3 py-1.5 mb-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="space-y-3">
                  {categoriesOrder.map((cat) => {
                    const items = filteredDefs.filter((b) => b.category === cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 mb-1.5">
                          {BLOCK_CATEGORY_LABELS[cat]}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {items.map((def) => {
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
                                      runAiTask: onRunAiTask
                                    });
                                  }
                                  setShowInserter(false);
                                  setInserterQuery('');
                                }}
                                className="flex items-start gap-2 p-2 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 text-left transition-colors"
                              >
                                <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shrink-0">
                                  <Icon size={14} />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                    {def.label}
                                  </span>
                                  <span className="block text-[10px] text-zinc-400 line-clamp-1">
                                    {def.description}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {filteredDefs.length === 0 && (
                    <div className="py-6 text-center text-xs text-zinc-400">Block tidak ditemukan.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Undo / Redo */}
        {!htmlSourceMode && (
          <div className="hidden sm:flex items-center gap-0.5 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
            <button
              type="button"
              disabled={!editor?.can().undo()}
              onClick={() => editor?.chain().focus().undo().run()}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              disabled={!editor?.can().redo()}
              onClick={() => editor?.chain().focus().redo().run()}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
            >
              <Redo2 size={15} />
            </button>
          </div>
        )}

        {/* Outline / Document Stats Popover */}
        <div className="relative hidden md:block" ref={outlineRef}>
          <button
            type="button"
            onClick={() => setShowOutline((v) => !v)}
            title="Struktur Outline & Statistik Kata"
            className={`p-1.5 rounded-lg transition-colors ${
              showOutline
                ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ListTree size={15} />
          </button>

          {showOutline && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl p-3.5 z-50 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Kata</div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">{wordCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Waktu Baca</div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">{readingTime} mnt</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Kerangka Heading ({outlineItems.length})
                </div>
                {outlineItems.length === 0 ? (
                  <p className="text-zinc-400 text-[11px] py-2">Belum ada Heading H2/H3/H4 di konten.</p>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {outlineItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          editor?.chain().focus().setTextSelection(item.pos + 1).scrollIntoView().run();
                          setShowOutline(false);
                        }}
                        className="w-full text-left px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-1.5"
                      >
                        <span className="text-[10px] font-bold text-blue-600 shrink-0">H{item.level}</span>
                        <span className="truncate text-zinc-700 dark:text-zinc-200">{item.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <StatusBadge status={status} />
        {renderAutosaveIndicator()}
      </div>

      {/* CENTER SECTION: Article Breadcrumb */}
      <div className="hidden xl:flex items-center gap-2 min-w-0 max-w-md px-3">
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
          {title.trim() || 'Artikel Baru Tanpa Judul'}
        </span>
        <span className="text-[11px] font-mono text-zinc-400 truncate">
          /blog/{slug || '...'}
        </span>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleAiDrawer}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            aiDrawerOpen
              ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title="Buka AI Writing Assistant"
        >
          <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="hidden lg:inline">AI Writer</span>
        </button>

        <button
          type="button"
          onClick={onOpenPreview}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Pratinjau Artikel Desktop & Mobile"
        >
          <Eye size={14} />
          <span className="hidden md:inline">Pratinjau</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onSaveDraft}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-100 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          <span className="hidden sm:inline">{status === 'published' ? 'Simpan' : 'Simpan Draft'}</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onPublishOrUpdate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
        >
          <Send size={13} />
          <span>{status === 'published' ? 'Perbarui' : status === 'scheduled' ? 'Jadwalkan' : 'Terbitkan'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Tutup Sidebar Pengaturan' : 'Buka Sidebar Pengaturan'}
          className={`p-1.5 rounded-lg border transition-colors ${
            sidebarOpen
              ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>

        {/* More Actions Dropdown */}
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu((v) => !v)}
            title="Opsi Tambahan"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <MoreVertical size={15} />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  onToggleHtmlSource();
                  setShowMoreMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              >
                <Code2 size={14} className="text-blue-600" />
                {htmlSourceMode ? 'Mode Editor Visual (Block)' : 'Mode Editor Kode HTML'}
              </button>

              {articleId && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenRevisions();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                >
                  <History size={14} className="text-zinc-500" />
                  Riwayat Revisi &amp; Revert
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onCopyHtml();
                  setShowMoreMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              >
                <Copy size={14} className="text-zinc-500" />
                Salin Konten HTML
              </button>

              {articleId && status === 'published' && (
                <a
                  href={`/blog/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowMoreMenu(false)}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-blue-600 font-medium border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-2"
                >
                  <ExternalLink size={14} />
                  Buka Artikel Live di Web
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

