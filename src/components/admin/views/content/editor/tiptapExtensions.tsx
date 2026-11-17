import React, { createContext, useContext, useState } from 'react';
import { mergeAttributes, Node } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps
} from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Code2,
  ExternalLink,
  Eye,
  Film,
  Images,
  Info,
  Lightbulb,
  AlertTriangle,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Loader2,
  MousePointerClick,
  Check
} from 'lucide-react';
import { seoIntelligenceApi } from '../../../../../services/blogApi';
import { notify } from '../../../../../lib/notify';
import type { GalleryImageItem } from './editorTypes';

export interface EditorMediaBridge {
  articleTitle: string;
  focusKeyphrase: string;
  onReplaceFigureImage: (pos: number, currentAttrs: Record<string, unknown>) => void;
  onAddGalleryImages: (pos: number, currentImages: GalleryImageItem[]) => void;
}

export const EditorMediaBridgeContext = createContext<EditorMediaBridge>({
  articleTitle: '',
  focusKeyphrase: '',
  onReplaceFigureImage: () => {},
  onAddGalleryImages: () => {}
});

export function toSafeEmbedUrl(rawUrl: string): string | null {
  const input = rawUrl.trim();
  if (!input) return null;

  try {
    const parsed = new URL(input);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        return `https://www.${host}${parsed.pathname}${parsed.search}`;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.replace('/shorts/', '').split('/')[0];
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
      }
      const v = parsed.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${encodeURIComponent(v)}` : null;
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === 'player.vimeo.com' && parsed.pathname.startsWith('/video/')) {
      return `https://player.vimeo.com${parsed.pathname}`;
    }

    if (host === 'loom.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const id = parts[1];
      if ((parts[0] === 'share' || parts[0] === 'embed') && id) {
        return `https://www.loom.com/embed/${encodeURIComponent(id)}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// =========================================================================
// 1. FIGURE / IMAGE BLOCK NODE (Compatible with both <figure> & <img>)
// =========================================================================

const FigureImageView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  getPos,
  selected
}) => {
  const bridge = useContext(EditorMediaBridgeContext);
  const src = String(node.attrs.src || '');
  const alt = String(node.attrs.alt || '');
  const caption = String(node.attrs.caption || '');
  const align = (node.attrs.align as 'left' | 'center' | 'right') || 'center';
  const width = (node.attrs.width as '100%' | '75%' | '50%') || '100%';

  const [editingAlt, setEditingAlt] = useState(false);
  const [generatingAlt, setGeneratingAlt] = useState(false);

  const handleGenerateAiAlt = async () => {
    setGeneratingAlt(true);
    try {
      const res = await seoIntelligenceApi.aiAssist(
        'alt_text',
        {
          title: bridge.articleTitle,
          focus_keyphrase: bridge.focusKeyphrase,
          featured_image: src
        },
        caption || src
      );
      if (res.result?.alt_text) {
        updateAttributes({ alt: res.result.alt_text });
        notify.toast('Alt text gambar dibuat oleh AI.');
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal membuat alt text.');
    } finally {
      setGeneratingAlt(false);
    }
  };

  const marginStyle =
    align === 'center' ? 'mx-auto' : align === 'left' ? 'mr-auto ml-0' : 'ml-auto mr-0';

  return (
    <NodeViewWrapper className="my-5" data-block-type="figureImage">
      <div
        className={`relative rounded-2xl transition-all ${
          selected
            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950'
            : 'hover:ring-1 hover:ring-zinc-300 dark:hover:ring-zinc-700'
        }`}
        style={{ maxWidth: width }}
      >
        <div className={marginStyle}>
          {/* Contextual Image Toolbar on selection */}
          {selected && (
            <div
              contentEditable={false}
              className="flex flex-wrap items-center gap-1 p-1.5 mb-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg text-xs"
            >
              {(['left', 'center', 'right'] as const).map((posAlign) => (
                <button
                  key={posAlign}
                  type="button"
                  onClick={() => updateAttributes({ align: posAlign })}
                  title={`Rata ${posAlign}`}
                  className={`p-1.5 rounded-lg transition-colors ${
                    align === posAlign
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {posAlign === 'left' ? (
                    <AlignLeft size={14} />
                  ) : posAlign === 'center' ? (
                    <AlignCenter size={14} />
                  ) : (
                    <AlignRight size={14} />
                  )}
                </button>
              ))}

              <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

              {(['50%', '75%', '100%'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateAttributes({ width: w })}
                  className={`px-2 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                    width === w
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {w}
                </button>
              ))}

              <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

              <button
                type="button"
                onClick={() => {
                  const p = typeof getPos === 'function' ? getPos() : null;
                  if (typeof p === 'number') {
                    bridge.onReplaceFigureImage(p, node.attrs);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium"
              >
                <RefreshCw size={12} /> Ganti
              </button>

              <button
                type="button"
                onClick={() => setEditingAlt((v) => !v)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${
                  editingAlt || !alt
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                }`}
              >
                Alt {!alt && <span className="text-[10px]">(Kosong)</span>}
              </button>

              <button
                type="button"
                disabled={generatingAlt}
                onClick={handleGenerateAiAlt}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium disabled:opacity-50"
              >
                {generatingAlt ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI Alt
              </button>

              <button
                type="button"
                onClick={deleteNode}
                title="Hapus block gambar"
                className="ml-auto p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {editingAlt && (
            <div
              contentEditable={false}
              className="mb-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2"
            >
              <span className="text-[11px] font-semibold text-zinc-500 shrink-0">Alt Text:</span>
              <input
                type="text"
                value={alt}
                onChange={(e) => updateAttributes({ alt: e.target.value })}
                placeholder="Deskripsikan gambar ini untuk aksesibilitas & SEO..."
                className="flex-1 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setEditingAlt(false)}
                className="p-1 rounded-lg bg-blue-600 text-white"
                title="Selesai"
              >
                <Check size={13} />
              </button>
            </div>
          )}

          <figure className="!my-0">
            <img
              src={src}
              alt={alt}
              className="w-full h-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800 block !my-0"
              loading="lazy"
            />
            <div contentEditable={false} className="mt-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder="Tambahkan keterangan gambar (opsional)..."
                className="w-full text-center bg-transparent text-xs text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:text-zinc-700 dark:focus:text-zinc-200 py-1"
              />
            </div>
          </figure>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const FigureImageExtension = Node.create({
  name: 'figureImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      align: { default: 'center' },
      width: { default: '100%' }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          const img = el.querySelector('img');
          if (!img) return false;
          const styleAttr = el.getAttribute('style') || '';
          const widthMatch = styleAttr.match(/max-width:\s*(100%|75%|50%)/i);
          let align: 'left' | 'center' | 'right' = 'center';
          if (/text-align:\s*left/i.test(styleAttr)) align = 'left';
          else if (/text-align:\s*right/i.test(styleAttr)) align = 'right';
          const figcaption = el.querySelector('figcaption');
          return {
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || '',
            caption: figcaption?.textContent?.trim() || '',
            align,
            width: widthMatch ? widthMatch[1] : '100%'
          };
        }
      },
      {
        tag: 'img[src]',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          if (el.closest('figure') || el.closest('.oneslabs-gallery')) return false;
          return {
            src: el.getAttribute('src') || '',
            alt: el.getAttribute('alt') || '',
            caption: '',
            align: 'center',
            width: '100%'
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src || '');
    const alt = String(HTMLAttributes.alt || '');
    const caption = String(HTMLAttributes.caption || '');
    const align = (HTMLAttributes.align as 'left' | 'center' | 'right') || 'center';
    const width = (HTMLAttributes.width as '100%' | '75%' | '50%') || '100%';

    const alignStyle =
      align === 'center'
        ? 'margin: 1.5rem auto; text-align: center;'
        : align === 'left'
          ? 'margin: 1.5rem auto 1.5rem 0; text-align: left;'
          : 'margin: 1.5rem 0 1.5rem auto; text-align: right;';

    const children: unknown[] = [
      [
        'img',
        {
          src,
          alt,
          style: 'width: 100%; height: auto; border-radius: 12px;',
          loading: 'lazy'
        }
      ]
    ];

    if (caption.trim()) {
      children.push([
        'figcaption',
        { style: 'font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;' },
        caption.trim()
      ]);
    }

    return [
      'figure',
      {
        'data-type': 'figure-image',
        style: `max-width: ${width}; ${alignStyle}`
      },
      ...children
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureImageView);
  }
});

// =========================================================================
// 2. CALLOUT / NOTICE BLOCK NODE
// =========================================================================

const CalloutBoxView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const tone = (node.attrs.tone as 'info' | 'tip' | 'warning') || 'info';
  const toneStyles: Record<string, string> = {
    info: 'border-blue-200 border-l-4 border-l-blue-600 bg-blue-50/70 text-blue-950 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-100',
    tip: 'border-emerald-200 border-l-4 border-l-emerald-600 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-100',
    warning:
      'border-amber-200 border-l-4 border-l-amber-600 bg-amber-50/80 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100'
  };

  return (
    <NodeViewWrapper className="my-5" data-block-type="calloutBox">
      <div
        className={`rounded-xl border px-4 py-3 transition-shadow ${toneStyles[tone]} ${
          selected ? 'ring-2 ring-blue-500/40' : ''
        }`}
      >
        <div contentEditable={false} className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/10">
          <div className="inline-flex items-center gap-1">
            {(
              [
                { id: 'info', label: 'Info', Icon: Info },
                { id: 'tip', label: 'Tips', Icon: Lightbulb },
                { id: 'warning', label: 'Perhatian', Icon: AlertTriangle }
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateAttributes({ tone: id })}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                  tone === id
                    ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white'
                    : 'opacity-65 hover:opacity-100'
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={deleteNode}
            title="Hapus Callout"
            className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 text-rose-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
        <NodeViewContent className="outline-none" />
      </div>
    </NodeViewWrapper>
  );
};

export const CalloutExtension = Node.create({
  name: 'calloutBox',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      tone: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-tone') || 'info',
        renderHTML: (attrs) => ({ 'data-tone': attrs.tone || 'info' })
      }
    };
  },

  parseHTML() {
    return [{ tag: 'div.callout-box' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ class: 'callout-box' }, HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBoxView);
  }
});

// =========================================================================
// 3. CTA / BUTTON BLOCK NODE
// =========================================================================

const CtaButtonView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const label = String(node.attrs.label || 'Konsultasi Sekarang');
  const href = String(node.attrs.href || '/schedule');
  const variant = (node.attrs.variant as 'primary' | 'secondary') || 'primary';
  const align = (node.attrs.align as 'left' | 'center' | 'right') || 'left';
  const newTab = Boolean(node.attrs.newTab);
  const [editing, setEditing] = useState(false);

  const alignCls =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <NodeViewWrapper className="my-5" data-block-type="ctaButton">
      <div
        contentEditable={false}
        className={`rounded-xl p-3 border transition-all ${
          selected || editing
            ? 'border-blue-300 bg-blue-50/30 dark:bg-blue-950/20'
            : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
        }`}
      >
        <div className={`flex items-center ${alignCls}`}>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <MousePointerClick size={15} />
            {label}
          </button>
        </div>

        {(selected || editing) && (
          <div className="mt-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Teks Tombol</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => updateAttributes({ label: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">URL Tujuan</label>
                <input
                  type="text"
                  value={href}
                  onChange={(e) => updateAttributes({ href: e.target.value })}
                  placeholder="/schedule atau https://..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex gap-1">
                {(['/schedule', '/hosting', '/docs'] as const).map((urlOpt) => (
                  <button
                    key={urlOpt}
                    type="button"
                    onClick={() => updateAttributes({ href: urlOpt })}
                    className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 text-[11px] text-zinc-600 hover:text-blue-700 font-mono"
                  >
                    {urlOpt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={() => updateAttributes({ variant: variant === 'primary' ? 'secondary' : 'primary' })}
                  className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold"
                >
                  Gaya: {variant === 'primary' ? 'Utama' : 'Sekunder'}
                </button>
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => updateAttributes({ align: a })}
                    className={`p-1 rounded-lg border ${
                      align === a ? 'bg-blue-600 text-white border-blue-600' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => updateAttributes({ newTab: !newTab })}
                  className={`px-2 py-1 rounded-lg border text-[11px] inline-flex items-center gap-1 ${
                    newTab ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <ExternalLink size={11} /> Tab Baru
                </button>
                <button
                  type="button"
                  onClick={deleteNode}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                  title="Hapus Block CTA"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const CtaButtonExtension = Node.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      label: { default: 'Konsultasi dengan Tim 1sLabs' },
      href: { default: '/schedule' },
      variant: { default: 'primary' },
      align: { default: 'left' },
      newTab: { default: false }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.oneslabs-cta-block',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          const anchor = el.querySelector('a');
          return {
            label: anchor?.textContent?.trim() || 'Pelajari Selengkapnya',
            href: anchor?.getAttribute('href') || '/schedule',
            variant: el.getAttribute('data-variant') === 'secondary' ? 'secondary' : 'primary',
            align: (el.getAttribute('data-align') as 'left' | 'center' | 'right') || 'left',
            newTab: anchor?.getAttribute('target') === '_blank'
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const label = String(HTMLAttributes.label || 'Pelajari Selengkapnya');
    const href = String(HTMLAttributes.href || '/schedule');
    const variant = HTMLAttributes.variant === 'secondary' ? 'secondary' : 'primary';
    const align = (HTMLAttributes.align as 'left' | 'center' | 'right') || 'left';
    const newTab = Boolean(HTMLAttributes.newTab);

    return [
      'div',
      {
        class: 'oneslabs-cta-block',
        'data-variant': variant,
        'data-align': align,
        style: `text-align: ${align};`
      },
      [
        'a',
        {
          class: 'oneslabs-cta-btn',
          href,
          ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})
        },
        label
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CtaButtonView);
  }
});

// =========================================================================
// 4. VIDEO EMBED BLOCK NODE (YouTube, Vimeo, Loom)
// =========================================================================

const EmbedBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const rawUrl = String(node.attrs.embedUrl || '');
  const [draftUrl, setDraftUrl] = useState(rawUrl);
  const safeUrl = toSafeEmbedUrl(rawUrl) || (rawUrl.startsWith('https://') ? rawUrl : null);

  const handleApplyUrl = () => {
    const converted = toSafeEmbedUrl(draftUrl);
    if (!converted) {
      notify.warning('Masukkan URL video YouTube, Vimeo, atau Loom yang valid.');
      return;
    }
    updateAttributes({ embedUrl: converted });
  };

  return (
    <NodeViewWrapper className="my-5" data-block-type="embedBlock">
      <div
        contentEditable={false}
        className={`rounded-2xl border p-3 bg-zinc-50 dark:bg-zinc-900/60 transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Film size={15} className="text-blue-600 shrink-0" />
          <input
            type="url"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyUrl();
              }
            }}
            placeholder="Tempel tautan YouTube, Vimeo, atau Loom..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Muat Video
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
            title="Hapus Embed"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {safeUrl ? (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900">
            <iframe
              src={safeUrl}
              title="Embedded video"
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
            Tempel URL YouTube / Vimeo / Loom di atas lalu klik Muat Video.
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const EmbedExtension = Node.create({
  name: 'embedBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      embedUrl: { default: '' }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.oneslabs-embed',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          const attrUrl = el.getAttribute('data-embed-url');
          const iframe = el.querySelector('iframe');
          return {
            embedUrl: attrUrl || iframe?.getAttribute('src') || ''
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const raw = String(HTMLAttributes.embedUrl || '');
    const safeUrl = toSafeEmbedUrl(raw) || raw;
    if (!safeUrl) {
      return ['div', { class: 'oneslabs-embed', 'data-embed-url': '' }];
    }
    return [
      'div',
      { class: 'oneslabs-embed', 'data-embed-url': safeUrl },
      [
        'iframe',
        {
          src: safeUrl,
          title: 'Embedded video',
          loading: 'lazy',
          allowfullscreen: 'true',
          referrerpolicy: 'strict-origin-when-cross-origin'
        }
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedBlockView);
  }
});

// =========================================================================
// 5. GALLERY BLOCK NODE
// =========================================================================

const GalleryBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, getPos, selected }) => {
  const bridge = useContext(EditorMediaBridgeContext);
  const cols = Number(node.attrs.cols) === 3 ? 3 : 2;
  const images: GalleryImageItem[] = Array.isArray(node.attrs.images) ? node.attrs.images : [];

  const handleRemoveImage = (idx: number) => {
    updateAttributes({ images: images.filter((_, i) => i !== idx) });
  };

  return (
    <NodeViewWrapper className="my-5" data-block-type="galleryBlock">
      <div
        contentEditable={false}
        className={`rounded-2xl border p-3.5 bg-zinc-50/70 dark:bg-zinc-900/50 transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200">
            <Images size={14} className="text-blue-600" /> Galeri Gambar ({images.length})
          </span>
          <div className="flex items-center gap-1.5">
            {([2, 3] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateAttributes({ cols: c })}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                  cols === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600'
                }`}
              >
                {c} Kolom
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const p = typeof getPos === 'function' ? getPos() : null;
                if (typeof p === 'number') bridge.onAddGalleryImages(p, images);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold"
            >
              <Plus size={12} /> Tambah Gambar
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
              title="Hapus Galeri"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              const p = typeof getPos === 'function' ? getPos() : null;
              if (typeof p === 'number') bridge.onAddGalleryImages(p, images);
            }}
            className="w-full py-8 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            Klik untuk memilih gambar dari Media Library ke dalam galeri ini
          </button>
        ) : (
          <div className={`grid gap-2.5 ${cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
            {images.map((img, idx) => (
              <div key={`${img.src}-${idx}`} className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white">
                <img src={img.src} alt={img.alt} className="w-full aspect-[16/10] object-cover !my-0 !rounded-none" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-rose-600 opacity-0 group-hover:opacity-100 shadow transition-opacity"
                  title="Keluarkan dari galeri"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const GalleryExtension = Node.create({
  name: 'galleryBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      cols: { default: 2 },
      images: { default: [] as GalleryImageItem[] }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.oneslabs-gallery',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          const cols = Number(el.getAttribute('data-cols')) === 3 ? 3 : 2;
          const imgNodes = Array.from(el.querySelectorAll('img')).map((img) => ({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || ''
          }));
          return { cols, images: imgNodes };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const cols = Number(HTMLAttributes.cols) === 3 ? 3 : 2;
    const images: GalleryImageItem[] = Array.isArray(HTMLAttributes.images) ? HTMLAttributes.images : [];
    const imgChildren = images.map((img) => [
      'img',
      { src: img.src, alt: img.alt || '', loading: 'lazy' }
    ]);
    return ['div', { class: 'oneslabs-gallery', 'data-cols': String(cols) }, ...imgChildren];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryBlockView);
  }
});

// =========================================================================
// 6. CUSTOM HTML BLOCK NODE
// =========================================================================

export function sanitizeClientHtml(raw: string): string {
  if (!raw || typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return String(raw || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  root.querySelectorAll('script, style, object, embed, form, input, button[type="submit"], link, meta, base').forEach((el) => {
    el.remove();
  });

  root.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim();
      if (name.startsWith('on') || name === 'srcdoc') {
        el.removeAttribute(attr.name);
      } else if ((name === 'href' || name === 'src' || name === 'action') && /^javascript:/i.test(val)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return root.innerHTML;
}

const CustomHtmlView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const html = String(node.attrs.html || '');
  const safeHtml = sanitizeClientHtml(html);
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <NodeViewWrapper className="my-5" data-block-type="customHtmlBlock">
      <div
        contentEditable={false}
        className={`rounded-xl border overflow-hidden ${
          selected ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-700'
        }`}
      >
        <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
            <Code2 size={13} className="text-blue-600" /> Block HTML Kustom (Disanitasi Otomatis)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPreviewMode((p) => !p)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium"
            >
              <Eye size={11} /> {previewMode ? 'Edit HTML' : 'Pratinjau'}
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded text-rose-600 hover:bg-rose-50"
              title="Hapus Block HTML"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        {previewMode ? (
          <div className="p-4 bg-white dark:bg-zinc-900 text-sm" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        ) : (
          <textarea
            rows={4}
            value={html}
            onChange={(e) => updateAttributes({ html: e.target.value })}
            placeholder="<div class='...'>Tulis HTML kustom yang aman di sini...</div>"
            className="w-full p-3 font-mono text-xs bg-zinc-950 text-zinc-100 focus:outline-none"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const CustomHtmlExtension = Node.create({
  name: 'customHtmlBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      html: { default: '' }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.oneslabs-custom-html',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          return { html: el.innerHTML };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const dom = document.createElement('div');
    dom.className = 'oneslabs-custom-html';
    dom.innerHTML = sanitizeClientHtml(String(HTMLAttributes.html || ''));
    return dom;
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomHtmlView);
  }
});
