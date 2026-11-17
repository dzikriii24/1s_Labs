import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Editor } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import {
  Check,
  ExternalLink,
  History,
  Link2,
  Loader2,
  RotateCcw,
  Table as TableIcon,
  X
} from 'lucide-react';
import {
  blogApi,
  seoIntelligenceApi,
  type AiSeoAuditResult,
  type BlogArticle,
  type BlogAuthor,
  type BlogCategory,
  type BlogRevision,
  type BlogTag,
  type FaqItem,
  type OneClickOptimizeResult,
  type SeoAnalysisResult,
  type TopicCluster
} from '../../../../services/blogApi';
import { notify } from '../../../../lib/notify';
import { formatDateId, toDatetimeLocalValue } from './blogUiUtils';
import { MediaLibraryModal } from './MediaLibraryModal';
import { OneClickOptimizeModal } from './OneClickOptimizeModal';
import {
  INITIAL_FORM,
  quickSlugify,
  type AutosaveStatus,
  type EditorFormState,
  type GalleryImageItem,
  type SelectedAiPreview,
  type SelectionRangeText,
  type SidebarInspectorTab
} from './editor/editorTypes';
import {
  CalloutExtension,
  CtaButtonExtension,
  CustomHtmlExtension,
  EditorMediaBridgeContext,
  EmbedExtension,
  FigureImageExtension,
  GalleryExtension
} from './editor/tiptapExtensions';
import { ArticleEditorToolbar } from './editor/ArticleEditorToolbar';
import { ArticleFormattingToolbar } from './editor/ArticleFormattingToolbar';
import { ArticleBlockEditor } from './editor/ArticleBlockEditor';
import { ArticleSettingsSidebar } from './editor/ArticleSettingsSidebar';
import {
  ArticleAIAssistant,
  type AiTaskOutput,
  type AiTaskResultPayload
} from './editor/ArticleAIAssistant';
import { ArticlePreviewModal } from './editor/ArticlePreviewModal';

interface ArticleEditorViewProps {
  articleId: number | null;
  onBack: () => void;
  onSaved: (savedId: number) => void;
}

type MediaTarget =
  | { kind: 'featured' }
  | { kind: 'og' }
  | { kind: 'inline_new' }
  | { kind: 'replace_figure'; pos: number; currentAttrs: Record<string, unknown> }
  | { kind: 'gallery_add'; pos: number; currentImages: GalleryImageItem[] };

const EMPTY_SEO: SeoAnalysisResult = {
  seo_score: 0,
  readability_score: 0,
  geo_score: 0,
  composite_score: 0,
  health_status: 'poor',
  metrics: {
    word_count: 0,
    reading_time: 1,
    sentence_count: 0,
    long_sentence_ratio: 0,
    paragraph_count: 0,
    long_paragraph_count: 0,
    h1_in_body_count: 0,
    h2_count: 0,
    subheading_count: 0,
    max_words_without_subheading: 0,
    transition_ratio: 0,
    passive_ratio: 0,
    title_length: 0,
    title_pixel_width: 0,
    meta_description_length: 0,
    slug_length: 0,
    keyphrase_count: 0,
    keyphrase_density: 0,
    internal_links_count: 0,
    external_links_count: 0,
    content_images_count: 0,
    images_missing_alt_count: 0,
    list_count: 0,
    table_count: 0,
    callout_count: 0,
    faq_count: 0,
    detected_intent: 'informational',
    matched_entities: []
  },
  links: { internal: [], external: [] },
  headings: [],
  checks: []
};

function parseFaqJson(raw?: string | null): FaqItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x) => x && typeof x.question === 'string' && typeof x.answer === 'string')
      : [];
  } catch {
    return [];
  }
}

export const ArticleEditorView: React.FC<ArticleEditorViewProps> = ({
  articleId,
  onBack,
  onSaved
}) => {
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(articleId);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [form, setForm] = useState<EditorFormState>(INITIAL_FORM);
  const [slugLocked, setSlugLocked] = useState(Boolean(articleId));

  // Metadata catalogs
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tagsList, setTagsList] = useState<BlogTag[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [revisions, setRevisions] = useState<BlogRevision[]>([]);
  const [publishedArticles, setPublishedArticles] = useState<BlogArticle[]>([]);

  // Workspace chrome states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarInspectorTab>('post');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [htmlSourceMode, setHtmlSourceMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState('<p></p>');
  const [externalInserterTick, setExternalInserterTick] = useState(0);

  // SEO & AI states
  const [seo, setSeo] = useState<SeoAnalysisResult>(EMPTY_SEO);
  const [analyzingSeo, setAnalyzingSeo] = useState(false);
  const [aiLoadingTask, setAiLoadingTask] = useState<string | null>(null);
  const [lastAiOutput, setLastAiOutput] = useState<AiTaskOutput | null>(null);
  const [auditResult, setAuditResult] = useState<AiSeoAuditResult | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [optimizingOneClick, setOptimizingOneClick] = useState(false);
  const [oneClickResult, setOneClickResult] = useState<OneClickOptimizeResult | null>(null);

  // Selection AI state
  const [currentSelection, setCurrentSelection] = useState<SelectionRangeText | null>(null);
  const [selectedAiPreview, setSelectedAiPreview] = useState<SelectedAiPreview | null>(null);

  // Sub-modals
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);

  // Refs for race-free syncing and autosave
  const formRef = useRef(form);
  formRef.current = form;
  const articleIdRef = useRef(currentArticleId);
  articleIdRef.current = currentArticleId;
  const loadedArticleKeyRef = useRef<string | null>(null);
  const pendingInitialHtmlRef = useRef<string | null>(null);
  const suppressEditorUpdateRef = useRef(false);
  const editVersionRef = useRef(0);
  const [editTick, setEditTick] = useState(0);
  const saveSeqRef = useRef(0);
  const saveAbortRef = useRef<AbortController | null>(null);
  const openLinkModalRef = useRef<() => void>(() => {});
  const manualSaveRef = useRef<() => void>(() => {});

  const markDirtyChange = useCallback(() => {
    editVersionRef.current += 1;
    setEditTick((t) => t + 1);
    setHasUnsavedChanges(true);
    setAutosaveStatus('unsaved');
  }, []);

  const handleTipTapUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      if (suppressEditorUpdateRef.current) return;
      const html = ed.getHTML();
      setForm((prev) => ({ ...prev, content: html }));
      markDirtyChange();
    },
    [markDirtyChange]
  );

  const handleTipTapSelectionUpdate = useCallback(({ editor: ed }: { editor: Editor }) => {
    const { from, to } = ed.state.selection;
    if (from === to) {
      setCurrentSelection(null);
      return;
    }
    const text = ed.state.doc.textBetween(from, to, '\n').trim();
    if (text) {
      setCurrentSelection({ from, to, text });
    } else {
      setCurrentSelection(null);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: {
          HTMLAttributes: { class: 'language-text' }
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer'
        }
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Tulis subheading...';
          return "Mulai menulis artikel Anda... Ketik '/' untuk menyisipkan blok";
        }
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      FigureImageExtension,
      CalloutExtension,
      CtaButtonExtension,
      EmbedExtension,
      GalleryExtension,
      CustomHtmlExtension
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'oneslabs-blog-prose focus:outline-none min-h-[420px]'
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openLinkModalRef.current();
          return true;
        }
        return false;
      }
    },
    onUpdate: handleTipTapUpdate,
    onSelectionUpdate: handleTipTapSelectionUpdate
  });

  // Helper to programmatically replace whole TipTap document without firing dirty state unintentionally
  const applyContentToEditor = useCallback(
    (html: string, markDirty = false) => {
      const cleanHtml = html && html.trim() ? html : '<p></p>';
      setHtmlDraft(cleanHtml);
      setForm((prev) => ({ ...prev, content: cleanHtml }));
      if (editor) {
        suppressEditorUpdateRef.current = true;
        editor.commands.setContent(cleanHtml, false);
        suppressEditorUpdateRef.current = false;
      } else {
        pendingInitialHtmlRef.current = cleanHtml;
      }
      if (markDirty) {
        markDirtyChange();
      }
    },
    [editor, markDirtyChange]
  );

  // Sync loaded initial HTML once TipTap editor becomes ready
  useEffect(() => {
    if (editor && pendingInitialHtmlRef.current !== null) {
      const pending = pendingInitialHtmlRef.current;
      pendingInitialHtmlRef.current = null;
      suppressEditorUpdateRef.current = true;
      editor.commands.setContent(pending, false);
      suppressEditorUpdateRef.current = false;
    }
  }, [editor]);

  // Sync external articleId prop changes
  useEffect(() => {
    setCurrentArticleId(articleId);
    articleIdRef.current = articleId;
  }, [articleId]);

  // Collapse inspector automatically on narrower viewports on first mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Load metadata catalogs & existing article once per opened article key
  useEffect(() => {
    const targetKey = articleId ? String(articleId) : 'new';
    if (loadedArticleKeyRef.current === targetKey) {
      return;
    }

    let active = true;
    const loadAll = async () => {
      if (articleId) setLoading(true);
      try {
        const [catsRes, tagsRes, authorsRes, clustersRes, pubRes] = await Promise.all([
          blogApi.getCategories().catch(() => ({ categories: [] })),
          blogApi.getTags().catch(() => ({ tags: [] })),
          blogApi.getAuthors().catch(() => ({ authors: [] })),
          seoIntelligenceApi.getClusters().catch(() => ({ clusters: [] })),
          blogApi.getAdminPosts({ status: 'published', limit: 25 }).catch(() => ({ articles: [] }))
        ]);

        if (!active) return;
        setCategories(catsRes.categories || []);
        setTagsList(tagsRes.tags || []);
        setAuthors(authorsRes.authors || []);
        setClusters(clustersRes.clusters || []);
        setPublishedArticles(pubRes.articles || []);

        if (articleId) {
          const postRes = await blogApi.getAdminPost(articleId);
          if (!active) return;
          const a = postRes.article;
          const initialContent = a.content || '<p></p>';
          const loadedForm: EditorFormState = {
            title: a.title || '',
            slug: a.slug || '',
            excerpt: a.excerpt || '',
            content: initialContent,
            featured_image: a.featured_image || '',
            featured_image_alt: a.featured_image_alt || '',
            featured_image_caption: a.featured_image_caption || '',
            category_id: a.category_id ? String(a.category_id) : '',
            author_id: a.author_id ? String(a.author_id) : '',
            author_name: a.author_name || 'Tim Editorial 1sLabs',
            status: a.status || 'draft',
            visibility: a.visibility || 'public',
            priority: a.priority || 'medium',
            due_date: a.due_date ? String(a.due_date).slice(0, 10) : '',
            editorial_notes: a.editorial_notes || '',
            is_featured: Boolean(a.is_featured),
            is_pillar: Boolean(a.is_pillar),
            cluster_id: a.cluster_id ? String(a.cluster_id) : '',
            published_at: toDatetimeLocalValue(a.published_at),
            tags: Array.isArray(a.tags)
              ? a.tags.map((t: BlogTag | string) => (typeof t === 'string' ? t : t.name))
              : [],
            focus_keyphrase: a.focus_keyphrase || '',
            secondary_keyphrases: a.secondary_keyphrases || '',
            meta_title: a.meta_title || '',
            meta_description: a.meta_description || '',
            canonical_url: a.canonical_url || '',
            robots_directive: a.robots_directive || 'index,follow',
            og_title: a.og_title || '',
            og_description: a.og_description || '',
            og_image: a.og_image || '',
            schema_type: a.schema_type || 'BlogPosting',
            faq_items: parseFaqJson(a.faq_schema_json)
          };
          loadedArticleKeyRef.current = String(articleId);
          setForm(loadedForm);
          setSlugLocked(true);
          setHasUnsavedChanges(false);
          setAutosaveStatus(a.updated_at ? 'saved' : 'idle');
          if (a.updated_at) {
            setLastSavedAt(new Date(a.updated_at));
          }
          setHtmlDraft(initialContent);
          if (editor) {
            suppressEditorUpdateRef.current = true;
            editor.commands.setContent(initialContent, false);
            suppressEditorUpdateRef.current = false;
            pendingInitialHtmlRef.current = null;
          } else {
            pendingInitialHtmlRef.current = initialContent;
          }

          const revRes = await blogApi.getRevisions(articleId).catch(() => ({ revisions: [] }));
          if (active) setRevisions(revRes.revisions || []);
        } else {
          loadedArticleKeyRef.current = 'new';
          setForm(INITIAL_FORM);
          setSlugLocked(false);
          setHasUnsavedChanges(false);
          setAutosaveStatus('idle');
          setRevisions([]);
          setHtmlDraft('<p></p>');
          if (editor) {
            suppressEditorUpdateRef.current = true;
            editor.commands.setContent('<p></p>', false);
            suppressEditorUpdateRef.current = false;
            pendingInitialHtmlRef.current = null;
          } else {
            pendingInitialHtmlRef.current = '<p></p>';
          }
        }
      } catch (err) {
        notify.error(err instanceof Error ? err.message : 'Gagal memuat artikel.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAll();
    return () => {
      active = false;
    };
  }, [articleId, editor]);

  // Keep local form update helper clean & update slug automatically if unlocked
  const updateField = useCallback(
    <K extends keyof EditorFormState>(field: K, value: EditorFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'title' && !slugLocked) {
          next.slug = quickSlugify(String(value || ''));
        }
        return next;
      });
      markDirtyChange();
    },
    [slugLocked, markDirtyChange]
  );

  // Real-time debounced SEO + Readability + GEO analysis
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(async () => {
      setAnalyzingSeo(true);
      try {
        const res = await seoIntelligenceApi.analyzeArticle({
          id: currentArticleId || undefined,
          title: form.title,
          slug: form.slug || quickSlugify(form.title),
          excerpt: form.excerpt,
          content: form.content,
          featured_image: form.featured_image,
          featured_image_alt: form.featured_image_alt,
          focus_keyphrase: form.focus_keyphrase,
          secondary_keyphrases: form.secondary_keyphrases,
          meta_title: form.meta_title,
          meta_description: form.meta_description,
          canonical_url: form.canonical_url,
          faq_items: form.faq_items
        });
        if (res?.analysis) {
          setSeo(res.analysis);
        }
      } catch {
        // Non-blocking background analysis
      } finally {
        setAnalyzingSeo(false);
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [
    loading,
    currentArticleId,
    form.title,
    form.slug,
    form.excerpt,
    form.content,
    form.featured_image,
    form.featured_image_alt,
    form.focus_keyphrase,
    form.secondary_keyphrases,
    form.meta_title,
    form.meta_description,
    form.canonical_url,
    form.faq_items
  ]);

  const buildPayload = useCallback(
    (snapshot: EditorFormState, overrides?: Partial<EditorFormState> & { is_autosave?: boolean }) => {
      const merged = { ...snapshot, ...overrides };
      const latestHtml = htmlSourceMode
        ? htmlDraft
        : editor
          ? editor.getHTML()
          : merged.content;

      return {
        title: merged.title.trim() || 'Artikel Tanpa Judul',
        slug: merged.slug.trim() || quickSlugify(merged.title) || `artikel-${Date.now()}`,
        excerpt: merged.excerpt.trim(),
        content: latestHtml,
        featured_image: merged.featured_image || null,
        featured_image_alt: merged.featured_image_alt || null,
        featured_image_caption: merged.featured_image_caption || null,
        category_id: merged.category_id ? Number(merged.category_id) : null,
        author_id: merged.author_id ? Number(merged.author_id) : null,
        author_name: merged.author_name || 'Tim Editorial 1sLabs',
        status: merged.status,
        visibility: merged.visibility,
        priority: merged.priority,
        due_date: merged.due_date || null,
        editorial_notes: merged.editorial_notes || null,
        is_featured: merged.is_featured,
        is_pillar: merged.is_pillar,
        cluster_id: merged.cluster_id ? Number(merged.cluster_id) : null,
        published_at: merged.published_at || null,
        tags: merged.tags,
        focus_keyphrase: merged.focus_keyphrase || null,
        secondary_keyphrases: merged.secondary_keyphrases || null,
        meta_title: merged.meta_title || null,
        meta_description: merged.meta_description || null,
        canonical_url: merged.canonical_url || null,
        robots_directive: merged.robots_directive || 'index,follow',
        og_title: merged.og_title || null,
        og_description: merged.og_description || null,
        og_image: merged.og_image || null,
        schema_type: merged.schema_type || 'BlogPosting',
        faq_items: merged.faq_items,
        is_autosave: Boolean(overrides?.is_autosave)
      };
    },
    [editor, htmlDraft, htmlSourceMode]
  );

  const creatingRef = useRef(false);

  // Core save runner with monotonic sequence guard, create-dedupe, & version tracking
  const persistArticle = useCallback(
    async (options: {
      isAutosave?: boolean;
      overrideStatus?: EditorFormState['status'];
      silent?: boolean;
    }) => {
      const snapshot = formRef.current;
      if (!options.isAutosave && !snapshot.title.trim()) {
        notify.warning('Mohon isi judul artikel terlebih dahulu sebelum menyimpan.');
        return;
      }

      // Never abort an in-flight POST /admin/posts creation to avoid duplicate draft rows
      if (!articleIdRef.current && creatingRef.current) {
        return;
      }

      if (saveAbortRef.current && articleIdRef.current) {
        saveAbortRef.current.abort();
      }
      const controller = new AbortController();
      saveAbortRef.current = controller;
      const mySeq = ++saveSeqRef.current;
      const versionAtStart = editVersionRef.current;
      const targetId = articleIdRef.current;
      if (!targetId) {
        creatingRef.current = true;
      }

      setSaving(!options.isAutosave);
      setAutosaveStatus('saving');

      const nextStatus = options.overrideStatus ?? snapshot.status;
      const nextPublishedAt =
        nextStatus === 'published' && !snapshot.published_at
          ? toDatetimeLocalValue(new Date().toISOString())
          : snapshot.published_at;

      const payload = buildPayload(snapshot, {
        status: nextStatus,
        published_at: nextPublishedAt,
        is_autosave: options.isAutosave
      });

      try {
        const res = targetId
          ? await blogApi.updatePost(targetId, payload, { signal: controller.signal })
          : await blogApi.createPost(payload);

        if (mySeq !== saveSeqRef.current) return;

        const savedArticle = res.article;
        if (options.overrideStatus || (!snapshot.published_at && nextPublishedAt)) {
          setForm((prev) => ({
            ...prev,
            status: savedArticle.status || nextStatus,
            slug: savedArticle.slug || prev.slug,
            published_at: savedArticle.published_at
              ? toDatetimeLocalValue(savedArticle.published_at)
              : nextPublishedAt
          }));
        } else if (!snapshot.slug && savedArticle.slug) {
          setForm((prev) => ({ ...prev, slug: savedArticle.slug }));
        }

        if (!targetId && savedArticle.id) {
          loadedArticleKeyRef.current = String(savedArticle.id);
          setCurrentArticleId(savedArticle.id);
          articleIdRef.current = savedArticle.id;
          setSlugLocked(true);
          onSaved(savedArticle.id);
        }

        setLastSavedAt(new Date());
        if (editVersionRef.current === versionAtStart) {
          setHasUnsavedChanges(false);
          setAutosaveStatus('saved');
        } else {
          // User continued editing while request was in flight; schedule immediate follow-up autosave
          setHasUnsavedChanges(true);
          setAutosaveStatus('unsaved');
          setEditTick((t) => t + 1);
        }

        if (!options.isAutosave && savedArticle.id) {
          blogApi
            .getRevisions(savedArticle.id)
            .then((revRes) => setRevisions(revRes.revisions || []))
            .catch(() => {});
        }

        if (!options.silent && !options.isAutosave) {
          if (nextStatus === 'published') {
            notify.success('Artikel berhasil diterbitkan dan disinkronkan ke SEO Index.');
          } else {
            notify.success('Artikel berhasil disimpan.');
          }
        }
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (mySeq !== saveSeqRef.current) return;
        setAutosaveStatus('error');
        if (!options.isAutosave) {
          notify.error(err instanceof Error ? err.message : 'Gagal menyimpan artikel.');
        }
      } finally {
        if (!targetId) {
          creatingRef.current = false;
        }
        if (mySeq === saveSeqRef.current) {
          setSaving(false);
        }
      }
    },
    [buildPayload, onSaved]
  );

  // Realtime debounced autosave (~1.2s) persisted straight to database for all edits
  useEffect(() => {
    if (loading || !hasUnsavedChanges || saving) return;

    const current = formRef.current;
    const plainBody = String(current.content || '')
      .replace(/<[^>]+>/g, ' ')
      .trim();
    const hasMeaningfulInput =
      Boolean(articleIdRef.current) ||
      current.title.trim().length > 0 ||
      plainBody.length > 0 ||
      current.excerpt.trim().length > 0 ||
      Boolean(current.featured_image);

    if (!hasMeaningfulInput) return;

    const timer = window.setTimeout(() => {
      persistArticle({ isAutosave: true, silent: true });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [loading, hasUnsavedChanges, saving, editTick, persistArticle]);

  // Warn user before leaving browser tab with unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Ctrl+S / Cmd+S shortcut
  manualSaveRef.current = () => {
    persistArticle({ isAutosave: false });
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        manualSaveRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackClick = async () => {
    if (hasUnsavedChanges) {
      const ok = await notify.confirm({
        title: 'Perubahan Belum Disimpan',
        text: 'Anda memiliki perubahan yang belum disimpan ke server. Keluar tanpa menyimpan?',
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Lanjut Mengedit'
      });
      if (!ok) return;
    }
    onBack();
  };

  // Toggle HTML Source vs Visual Block mode
  const handleToggleHtmlSource = () => {
    if (!htmlSourceMode) {
      const currentHtml = editor ? editor.getHTML() : form.content;
      setHtmlDraft(currentHtml);
      setHtmlSourceMode(true);
    } else {
      applyContentToEditor(htmlDraft, htmlDraft !== form.content);
      setHtmlSourceMode(false);
    }
  };

  const handleCopyHtml = async () => {
    try {
      const html = htmlSourceMode ? htmlDraft : editor?.getHTML() || form.content;
      await navigator.clipboard.writeText(html);
      notify.success('Kode HTML artikel berhasil disalin.');
    } catch {
      notify.error('Gagal menyalin HTML ke clipboard.');
    }
  };

  // Link Modal flow
  const handleOpenLinkModal = useCallback(() => {
    if (!editor) return;
    const prevHref = editor.getAttributes('link')?.href || '';
    const prevTarget = editor.getAttributes('link')?.target === '_blank';
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, ' ');
    setLinkUrl(prevHref);
    setLinkText(selected);
    setLinkNewTab(prevTarget);
    setLinkModalOpen(true);
  }, [editor]);
  openLinkModalRef.current = handleOpenLinkModal;

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const cleanUrl = linkUrl.trim();
    if (!cleanUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkModalOpen(false);
      return;
    }
    const { empty } = editor.state.selection;
    if (empty && linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkText.trim(),
          marks: [
            {
              type: 'link',
              attrs: {
                href: cleanUrl,
                target: linkNewTab ? '_blank' : null,
                rel: linkNewTab ? 'noopener noreferrer' : null
              }
            }
          ]
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: cleanUrl,
          target: linkNewTab ? '_blank' : null
        })
        .run();
    }
    setLinkModalOpen(false);
  };

  // Table Insert flow
  const handleInsertTableConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({
        rows: Math.max(2, Math.min(12, tableRows)),
        cols: Math.max(2, Math.min(6, tableCols)),
        withHeaderRow: tableHeader
      })
      .run();
    setTableModalOpen(false);
  };

  // Featured image direct upload & AI Alt
  const handleUploadFeaturedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await blogApi.uploadImage(file);
      updateField('featured_image', res.url);
      if (!formRef.current.featured_image_alt) {
        updateField('featured_image_alt', formRef.current.title || file.name.replace(/\.[^.]+$/, ''));
      }
      notify.success('Gambar utama berhasil diunggah.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal mengunggah gambar.');
    }
  };

  const handleGenerateFeaturedAlt = async () => {
    if (!form.featured_image) return;
    setAiLoadingTask('featured_alt');
    try {
      const res = await seoIntelligenceApi.aiAssist(
        'alt_text',
        {
          title: form.title,
          focus_keyphrase: form.focus_keyphrase
        },
        `Featured image URL: ${form.featured_image}. Existing alt: ${form.featured_image_alt}`
      );
      const generatedAlt = res?.result?.alt_text;
      if (generatedAlt) {
        updateField('featured_image_alt', generatedAlt);
        notify.success('Alt text gambar utama dibuat oleh AI.');
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal membuat alt text.');
    } finally {
      setAiLoadingTask(null);
    }
  };

  // AI Writing Assistant calls
  const buildArticleContextForAi = () => ({
    title: formRef.current.title,
    slug: formRef.current.slug,
    excerpt: formRef.current.excerpt,
    content: htmlSourceMode ? htmlDraft : editor?.getHTML() || formRef.current.content,
    focus_keyphrase: formRef.current.focus_keyphrase,
    secondary_keyphrases: formRef.current.secondary_keyphrases,
    meta_title: formRef.current.meta_title,
    meta_description: formRef.current.meta_description,
    featured_image_alt: formRef.current.featured_image_alt
  });

  const handleRunWholeArticleAi = async (task: string, extraContext = '') => {
    setAiDrawerOpen(true);
    setAiLoadingTask(task);
    try {
      const res = await seoIntelligenceApi.aiAssist(task, buildArticleContextForAi(), extraContext);
      setLastAiOutput({
        task,
        model: res.model,
        latencyMs: res.latencyMs,
        result: (res.result || {}) as AiTaskResultPayload
      });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : `Gagal menjalankan AI (${task}).`);
    } finally {
      setAiLoadingTask(null);
    }
  };

  const handleRunSelectionAi = async (task: string, selectionOverride?: SelectionRangeText) => {
    const sel = selectionOverride || currentSelection;
    if (!sel || !sel.text.trim()) {
      notify.warning('Sorot atau pilih teks/blok di editor terlebih dahulu.');
      return;
    }

    setCurrentSelection(sel);
    setAiDrawerOpen(true);
    setAiLoadingTask(task);

    try {
      const res = await seoIntelligenceApi.aiAssist(task, buildArticleContextForAi(), sel.text);
      const result = (res.result || {}) as AiTaskResultPayload;

      if (task === 'generate_heading_selection') {
        setLastAiOutput({
          task,
          model: res.model,
          latencyMs: res.latencyMs,
          result
        });
        setSelectedAiPreview(null);
      } else {
        setSelectedAiPreview({
          task,
          originalText: result.original_text || sel.text,
          improvedHtml: result.improved_html || `<p>${result.improved_text || sel.text}</p>`,
          improvedText: result.improved_text || '',
          explanation: result.explanation || '',
          range: { from: sel.from, to: sel.to }
        });
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal memproses teks terpilih dengan AI.');
    } finally {
      setAiLoadingTask(null);
    }
  };

  const handleApplySelectedPreview = () => {
    if (!editor || !selectedAiPreview) return;
    const htmlToInsert = selectedAiPreview.improvedHtml || `<p>${selectedAiPreview.improvedText}</p>`;
    if (selectedAiPreview.range) {
      const docSize = editor.state.doc.content.size;
      const from = Math.max(0, Math.min(selectedAiPreview.range.from, docSize));
      const to = Math.max(from, Math.min(selectedAiPreview.range.to, docSize));
      editor.chain().focus().insertContentAt({ from, to }, htmlToInsert).run();
    } else {
      editor.chain().focus().insertContent(htmlToInsert).run();
    }
    setSelectedAiPreview(null);
    notify.success('Teks terpilih diperbarui dengan saran AI.');
  };

  const handleRunAiAudit = async () => {
    setAiDrawerOpen(true);
    setAuditing(true);
    try {
      const res = await seoIntelligenceApi.aiAudit(buildArticleContextForAi());
      setAuditResult(res);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menjalankan audit AI.');
    } finally {
      setAuditing(false);
    }
  };

  const handleRunOneClickOptimize = async () => {
    setOptimizingOneClick(true);
    try {
      const res = await seoIntelligenceApi.aiOneClickOptimize(buildArticleContextForAi());
      setOneClickResult(res.optimization);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menjalankan 1-Klik Optimasi AI.');
    } finally {
      setOptimizingOneClick(false);
    }
  };

  const handleApplyOneClick = () => {
    if (!oneClickResult) return;
    const p = oneClickResult.proposed;
    setForm((prev) => ({
      ...prev,
      title: p.title || prev.title,
      meta_title: p.meta_title || prev.meta_title,
      meta_description: p.meta_description || prev.meta_description,
      focus_keyphrase: p.focus_keyphrase || prev.focus_keyphrase,
      excerpt: p.excerpt || prev.excerpt,
      featured_image_alt: p.featured_image_alt || prev.featured_image_alt,
      faq_items: Array.isArray(p.faq_items) && p.faq_items.length > 0 ? p.faq_items : prev.faq_items
    }));
    if (p.content) {
      applyContentToEditor(p.content, true);
    } else {
      markDirtyChange();
    }
    setOneClickResult(null);
    notify.success('Optimasi SEO + GEO diterapkan. Perubahan akan disimpan otomatis.');
  };

  // HTML insertion helpers for AI output cards
  const handleInsertHtmlTop = (html: string) => {
    if (!editor) return;
    editor.chain().focus().insertContentAt(0, html).run();
    notify.success('Paragraf pembuka disisipkan di awal artikel.');
  };

  const handleInsertHtmlBottom = (html: string) => {
    if (!editor) return;
    const endPos = editor.state.doc.content.size;
    editor.chain().focus().insertContentAt(endPos, html).run();
    notify.success('Konten disisipkan di akhir artikel.');
  };

  const handleInsertHtmlAtCursor = (html: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
  };

  // Revision revert
  const handleRevertRevision = async (rev: BlogRevision) => {
    if (!currentArticleId) return;
    const ok = await notify.confirm({
      title: 'Pulihkan Revisi?',
      text: `Kembalikan judul, konten, dan metadata artikel ke versi ${formatDateId(rev.created_at, true)}?`,
      confirmButtonText: 'Pulihkan Versi Ini',
      cancelButtonText: 'Batal'
    });
    if (!ok) return;

    try {
      const res = await blogApi.revertRevision(currentArticleId, rev.id);
      const a = res.article;
      setForm((prev) => ({
        ...prev,
        title: a.title || prev.title,
        excerpt: a.excerpt || '',
        content: a.content || '<p></p>',
        meta_title: a.meta_title || '',
        meta_description: a.meta_description || '',
        focus_keyphrase: a.focus_keyphrase || ''
      }));
      applyContentToEditor(a.content || '<p></p>', false);
      setHasUnsavedChanges(false);
      setAutosaveStatus('saved');
      setRevisionsOpen(false);
      blogApi.getRevisions(currentArticleId).then((r) => setRevisions(r.revisions || []));
      notify.success('Artikel dipulihkan ke versi pilihan Anda.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal memulihkan revisi.');
    }
  };

  // Media bridge for custom React NodeViews inside TipTap (replace FigureImage, add Gallery images)
  const mediaBridgeValue = useMemo(
    () => ({
      articleTitle: form.title,
      focusKeyphrase: form.focus_keyphrase,
      onReplaceFigureImage: (pos: number, currentAttrs: Record<string, unknown>) => {
        setMediaTarget({ kind: 'replace_figure', pos, currentAttrs });
      },
      onAddGalleryImages: (pos: number, currentImages: GalleryImageItem[]) => {
        setMediaTarget({ kind: 'gallery_add', pos, currentImages });
      }
    }),
    [form.title, form.focus_keyphrase]
  );

  return (
    <EditorMediaBridgeContext.Provider value={mediaBridgeValue}>
      <div className="fixed inset-0 z-[55] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
        {/* Top Gutenberg Editor Bar */}
        <ArticleEditorToolbar
          editor={editor}
          articleId={currentArticleId}
          title={form.title}
          slug={form.slug}
          status={form.status}
          hasUnsavedChanges={hasUnsavedChanges}
          autosaveStatus={autosaveStatus}
          lastSavedAt={lastSavedAt}
          saving={saving}
          wordCount={seo.metrics.word_count}
          readingTime={seo.metrics.reading_time}
          sidebarOpen={sidebarOpen}
          aiDrawerOpen={aiDrawerOpen}
          htmlSourceMode={htmlSourceMode}
          onBack={handleBackClick}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
          onToggleAiDrawer={() => setAiDrawerOpen((p) => !p)}
          onOpenPreview={() => setPreviewOpen(true)}
          onSaveDraft={() =>
            persistArticle({
              isAutosave: false,
              overrideStatus: form.status === 'published' ? 'published' : form.status
            })
          }
          onPublishOrUpdate={() =>
            persistArticle({
              isAutosave: false,
              overrideStatus: form.status === 'scheduled' ? 'scheduled' : 'published'
            })
          }
          onOpenRevisions={() => setRevisionsOpen(true)}
          onToggleHtmlSource={handleToggleHtmlSource}
          onCopyHtml={handleCopyHtml}
          onOpenMediaInline={() => setMediaTarget({ kind: 'inline_new' })}
          onOpenTableModal={() => setTableModalOpen(true)}
          onRunAiTask={(task) => handleRunWholeArticleAi(task)}
        />

        {/* Contextual Formatting Strip + Selection BubbleMenu */}
        {!htmlSourceMode && (
          <ArticleFormattingToolbar
            editor={editor}
            onOpenLinkModal={handleOpenLinkModal}
            onAiSelectionAction={(task, sel) => handleRunSelectionAi(task, sel)}
            onOpenBlockInserter={() => setExternalInserterTick((t) => t + 1)}
          />
        )}

        {/* Main Studio Body: Canvas + Collapsible Inspector */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Center Paper Canvas */}
          <main className="flex-1 min-w-0 overflow-y-auto bg-white dark:bg-zinc-950">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-zinc-500">
                <Loader2 size={28} className="animate-spin text-blue-600" />
                <p className="text-sm font-medium">Memuat studio penulisan artikel...</p>
              </div>
            ) : (
              <ArticleBlockEditor
                editor={editor}
                title={form.title}
                excerpt={form.excerpt}
                featuredImage={form.featured_image}
                featuredImageAlt={form.featured_image_alt}
                featuredImageCaption={form.featured_image_caption}
                htmlSourceMode={htmlSourceMode}
                htmlContent={htmlDraft}
                aiAltLoading={aiLoadingTask === 'featured_alt'}
                onChangeTitle={(v) => updateField('title', v)}
                onChangeExcerpt={(v) => updateField('excerpt', v)}
                onChangeFeaturedAlt={(v) => updateField('featured_image_alt', v)}
                onChangeFeaturedCaption={(v) => updateField('featured_image_caption', v)}
                onRemoveFeaturedImage={() => {
                  updateField('featured_image', '');
                  updateField('featured_image_alt', '');
                  updateField('featured_image_caption', '');
                }}
                onOpenFeaturedMedia={() => setMediaTarget({ kind: 'featured' })}
                onUploadFeaturedFile={handleUploadFeaturedFile}
                onGenerateFeaturedAiAlt={handleGenerateFeaturedAlt}
                onChangeHtmlContent={(val) => {
                  setHtmlDraft(val);
                  updateField('content', val);
                }}
                onToggleVisualMode={handleToggleHtmlSource}
                onOpenMediaInline={() => setMediaTarget({ kind: 'inline_new' })}
                onOpenTableModal={() => setTableModalOpen(true)}
                onRunAiTask={(task) => handleRunWholeArticleAi(task)}
                onAiImproveBlock={(sel) => handleRunSelectionAi('improve_selection', sel)}
                externalOpenInserterTick={externalInserterTick}
              />
            )}
          </main>

          {/* Right Settings Inspector Sidebar */}
          <ArticleSettingsSidebar
            open={sidebarOpen}
            activeTab={sidebarTab}
            form={form}
            slugLocked={slugLocked}
            categories={categories}
            tagsList={tagsList}
            authors={authors}
            clusters={clusters}
            seo={seo}
            analyzing={analyzingSeo}
            aiLoadingTask={aiLoadingTask}
            optimizingOneClick={optimizingOneClick}
            revisionCount={revisions.length}
            onChangeTab={setSidebarTab}
            onClose={() => setSidebarOpen(false)}
            onUpdateField={updateField}
            onToggleSlugLock={() => setSlugLocked((p) => !p)}
            onOpenFeaturedMedia={() => setMediaTarget({ kind: 'featured' })}
            onOpenOgMedia={() => setMediaTarget({ kind: 'og' })}
            onGenerateFeaturedAlt={handleGenerateFeaturedAlt}
            onRunAiTask={handleRunWholeArticleAi}
            onRunOneClickOptimize={handleRunOneClickOptimize}
            onOpenRevisions={() => setRevisionsOpen(true)}
          />
        </div>

        {/* Floating AI Co-Writer & Selection Diff Assistant */}
        <ArticleAIAssistant
          open={aiDrawerOpen}
          selection={currentSelection}
          selectedAiPreview={selectedAiPreview}
          aiLoadingTask={aiLoadingTask}
          lastAiOutput={lastAiOutput}
          auditResult={auditResult}
          auditing={auditing}
          optimizingOneClick={optimizingOneClick}
          onClose={() => setAiDrawerOpen(false)}
          onRunSelectionTask={(task) => handleRunSelectionAi(task)}
          onApplySelectedPreview={handleApplySelectedPreview}
          onDiscardSelectedPreview={() => setSelectedAiPreview(null)}
          onRunArticleTask={handleRunWholeArticleAi}
          onRunAudit={handleRunAiAudit}
          onRunOneClickOptimize={handleRunOneClickOptimize}
          onInsertHtmlTop={handleInsertHtmlTop}
          onInsertHtmlBottom={handleInsertHtmlBottom}
          onInsertHtmlAtCursor={handleInsertHtmlAtCursor}
          onApplyTitle={(t, target) => updateField(target === 'main' ? 'title' : 'meta_title', t)}
          onApplyMetaDescription={(d) => updateField('meta_description', d)}
          onApplyKeyphrases={(primary, secondary) => {
            updateField('focus_keyphrase', primary);
            if (secondary && secondary.length > 0) {
              updateField('secondary_keyphrases', secondary.join(', '));
            }
          }}
          onApplyFaqItems={(items) => updateField('faq_items', items)}
        />

        {/* Live Desktop / Mobile Public Preview */}
        <ArticlePreviewModal
          isOpen={previewOpen}
          form={form}
          categories={categories}
          readingTime={seo.metrics.reading_time}
          wordCount={seo.metrics.word_count}
          onClose={() => setPreviewOpen(false)}
        />

        {/* One-Click Optimize Modal */}
        <OneClickOptimizeModal
          isOpen={Boolean(oneClickResult)}
          result={oneClickResult}
          onClose={() => setOneClickResult(null)}
          onApply={handleApplyOneClick}
        />

        {/* Media Library Modal (Featured / OG / New FigureImage / Replace FigureImage / Gallery) */}
        <MediaLibraryModal
          isOpen={Boolean(mediaTarget)}
          mode={mediaTarget?.kind === 'featured' || mediaTarget?.kind === 'og' ? 'featured' : 'inline'}
          articleTitle={form.title}
          focusKeyphrase={form.focus_keyphrase}
          onClose={() => setMediaTarget(null)}
          onSelectFeatured={(url, alt) => {
            if (!mediaTarget) return;
            if (mediaTarget.kind === 'featured') {
              updateField('featured_image', url);
              if (alt) updateField('featured_image_alt', alt);
            } else if (mediaTarget.kind === 'og') {
              updateField('og_image', url);
            }
            setMediaTarget(null);
          }}
          onInsertInline={(htmlSnippet) => {
            if (editor) {
              editor.chain().focus().insertContent(htmlSnippet).run();
            }
            setMediaTarget(null);
          }}
          onSelectStructuredImage={(img) => {
            if (!mediaTarget || !editor) return;
            if (mediaTarget.kind === 'inline_new') {
              editor
                .chain()
                .focus()
                .insertContent({
                  type: 'figureImage',
                  attrs: {
                    src: img.url,
                    alt: img.alt || form.title || 'Ilustrasi artikel',
                    caption: img.caption || '',
                    align: img.align || 'center',
                    width: img.width || '100%'
                  }
                })
                .run();
            } else if (mediaTarget.kind === 'replace_figure') {
              const { tr } = editor.state;
              const node = tr.doc.nodeAt(mediaTarget.pos);
              if (node && node.type.name === 'figureImage') {
                tr.setNodeMarkup(mediaTarget.pos, undefined, {
                  ...node.attrs,
                  src: img.url,
                  alt: img.alt || node.attrs.alt || form.title || 'Ilustrasi artikel',
                  caption: img.caption || node.attrs.caption || '',
                  align: img.align || node.attrs.align || 'center',
                  width: img.width || node.attrs.width || '100%'
                });
                editor.view.dispatch(tr);
              }
            } else if (mediaTarget.kind === 'gallery_add') {
              const { tr } = editor.state;
              const node = tr.doc.nodeAt(mediaTarget.pos);
              if (node && node.type.name === 'galleryBlock') {
                const updated = [...mediaTarget.currentImages, { src: img.url, alt: img.alt || form.title }];
                tr.setNodeMarkup(mediaTarget.pos, undefined, {
                  ...node.attrs,
                  images: updated
                });
                editor.view.dispatch(tr);
              }
            }
            setMediaTarget(null);
          }}
        />

        {/* Link Insert / Edit Modal */}
        {linkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <form
              onSubmit={handleApplyLink}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-xs"
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-sm inline-flex items-center gap-1.5">
                  <Link2 size={15} className="text-blue-600" /> Sisipkan atau Edit Link
                </span>
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">URL Tujuan</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://1slabs.my.id/... atau /blog/..."
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                {editor?.state.selection.empty && (
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Teks Link</label>
                    <input
                      type="text"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Baca selengkapnya..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                )}

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkNewTab}
                    onChange={(e) => setLinkNewTab(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600"
                  />
                  <span>Buka di tab baru (eksternal)</span>
                </label>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                  <p className="font-semibold text-zinc-500 text-[11px]">Link Internal Cepat 1sLabs:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Layanan Web & Cloud (/hosting)', url: '/hosting', title: 'Layanan Hosting & Infrastruktur 1sLabs' },
                      { label: 'Dokumentasi (/docs)', url: '/docs', title: 'Dokumentasi Teknis 1sLabs' },
                      { label: 'Jadwalkan Konsultasi (/schedule)', url: '/schedule', title: 'Jadwalkan Konsultasi Digital' },
                      { label: 'Daftar Blog (/blog)', url: '/blog', title: 'Artikel Wawasan 1sLabs' }
                    ].map((quick) => (
                      <button
                        key={quick.url}
                        type="button"
                        onClick={() => {
                          setLinkUrl(quick.url);
                          if (!linkText) setLinkText(quick.title);
                        }}
                        className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-100"
                      >
                        {quick.label}
                      </button>
                    ))}
                  </div>
                </div>

                {publishedArticles.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-500 text-[11px]">Artikel Terpublikasi Terbaru:</p>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {publishedArticles
                        .filter((p) => p.id !== currentArticleId)
                        .slice(0, 6)
                        .map((post) => (
                          <button
                            key={post.id}
                            type="button"
                            onClick={() => {
                              setLinkUrl(`/blog/${post.slug}`);
                              if (!linkText) setLinkText(post.title);
                            }}
                            className="w-full text-left px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 truncate flex items-center justify-between gap-2"
                          >
                            <span className="truncate font-medium">{post.title}</span>
                            <ExternalLink size={11} className="shrink-0 text-zinc-400" />
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  <Check size={13} /> Terapkan Link
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table Size Modal */}
        {tableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <form
              onSubmit={handleInsertTableConfirm}
              className="w-full max-w-xs rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-xs"
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-sm inline-flex items-center gap-1.5">
                  <TableIcon size={15} className="text-blue-600" /> Sisipkan Tabel
                </span>
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Jumlah Baris</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={tableRows}
                      onChange={(e) => setTableRows(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jumlah Kolom</label>
                    <input
                      type="number"
                      min={2}
                      max={6}
                      value={tableCols}
                      onChange={(e) => setTableCols(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tableHeader}
                    onChange={(e) => setTableHeader(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600"
                  />
                  <span>Sertakan Baris Header</span>
                </label>
              </div>
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Sisipkan Tabel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Revisions Drawer / Modal */}
        {revisionsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-xs">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-sm inline-flex items-center gap-1.5">
                  <History size={15} className="text-blue-600" /> Riwayat Revisi Artikel ({revisions.length})
                </span>
                <button
                  type="button"
                  onClick={() => setRevisionsOpen(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {revisions.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">
                    Belum ada riwayat revisi tersimpan untuk artikel ini.
                  </p>
                ) : (
                  revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 flex items-start justify-between gap-3 bg-zinc-50/60 dark:bg-zinc-950/50"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase">
                            {rev.revision_type}
                          </span>
                          <span className="text-zinc-500">{formatDateId(rev.created_at, true)}</span>
                        </div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{rev.title}</p>
                        {rev.change_summary && <p className="text-[11px] text-zinc-500">{rev.change_summary}</p>}
                        <p className="text-[10px] text-zinc-400">
                          SEO: {rev.seo_score} · Readability: {rev.readability_score} · GEO: {rev.geo_score}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevertRevision(rev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-semibold hover:border-blue-400 hover:text-blue-600 shrink-0"
                      >
                        <RotateCcw size={12} /> Pulihkan
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </EditorMediaBridgeContext.Provider>
  );
};
