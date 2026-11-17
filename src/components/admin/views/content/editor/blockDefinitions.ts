import type { Editor } from '@tiptap/react';
import {
  Pilcrow,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code2,
  Image as ImageIcon,
  Images,
  Film,
  Table as TableIcon,
  Info,
  MousePointerClick,
  FileCode,
  Sparkles,
  type LucideIcon
} from 'lucide-react';

export type BlockCategory = 'basic' | 'media' | 'advanced' | 'ai';

export interface BlockDefinition {
  id: string;
  label: string;
  description: string;
  category: BlockCategory;
  keywords: string[];
  icon: LucideIcon;
  execute: (ctx: {
    editor: Editor;
    openMediaInline: () => void;
    openTableModal: () => void;
    runAiTask: (task: string) => void;
    insertPos?: number;
  }) => void;
}

export const BLOCK_CATEGORY_LABELS: Record<BlockCategory, string> = {
  basic: 'Blok Dasar',
  media: 'Media & Embed',
  advanced: 'Blok Lanjutan',
  ai: 'Asisten AI 1sLabs'
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    id: 'paragraph',
    label: 'Paragraf',
    description: 'Tulis teks artikel standar dengan format rata & tautan.',
    category: 'basic',
    keywords: ['paragraf', 'paragraph', 'text', 'teks', 'p'],
    icon: Pilcrow,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<p></p>').setTextSelection(insertPos + 1).run();
      } else {
        chain.setParagraph().run();
      }
    }
  },
  {
    id: 'heading2',
    label: 'Heading H2',
    description: 'Judul bagian utama (bagus untuk Daftar Isi & SEO).',
    category: 'basic',
    keywords: ['heading', 'h2', 'judul', 'bab'],
    icon: Heading2,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<h2></h2>').setTextSelection(insertPos + 1).run();
      } else {
        chain.setHeading({ level: 2 }).run();
      }
    }
  },
  {
    id: 'heading3',
    label: 'Heading H3',
    description: 'Sub-topik di bawah Heading H2.',
    category: 'basic',
    keywords: ['heading', 'h3', 'subjudul', 'subheading'],
    icon: Heading3,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<h3></h3>').setTextSelection(insertPos + 1).run();
      } else {
        chain.setHeading({ level: 3 }).run();
      }
    }
  },
  {
    id: 'heading4',
    label: 'Heading H4',
    description: 'Sub-poin rinci di dalam sub-topik.',
    category: 'basic',
    keywords: ['heading', 'h4', 'detail'],
    icon: Heading4,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<h4></h4>').setTextSelection(insertPos + 1).run();
      } else {
        chain.setHeading({ level: 4 }).run();
      }
    }
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Daftar poin tanpa nomor agar mudah dipindai.',
    category: 'basic',
    keywords: ['list', 'bullet', 'ul', 'daftar', 'poin'],
    icon: List,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<ul><li><p></p></li></ul>').run();
      } else {
        chain.toggleBulletList().run();
      }
    }
  },
  {
    id: 'orderedList',
    label: 'Numbered List',
    description: 'Daftar langkah terurut dengan penomoran.',
    category: 'basic',
    keywords: ['numbered', 'ordered', 'ol', 'angka', 'langkah', 'list'],
    icon: ListOrdered,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<ol><li><p></p></li></ol>').run();
      } else {
        chain.toggleOrderedList().run();
      }
    }
  },
  {
    id: 'blockquote',
    label: 'Quote / Kutipan',
    description: 'Sorot pernyataan kunci atau kutipan referensi.',
    category: 'basic',
    keywords: ['quote', 'kutipan', 'blockquote'],
    icon: Quote,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<blockquote><p></p></blockquote>').run();
      } else {
        chain.toggleBlockquote().run();
      }
    }
  },
  {
    id: 'horizontalRule',
    label: 'Divider / Pemisah',
    description: 'Garis pemisah visual antar bagian artikel.',
    category: 'basic',
    keywords: ['divider', 'separator', 'hr', 'garis', 'pemisah'],
    icon: Minus,
    execute: ({ editor, insertPos }) => {
      if (typeof insertPos === 'number') {
        editor.chain().focus().insertContentAt(insertPos, '<hr><p></p>').run();
      } else {
        editor.chain().focus().setHorizontalRule().run();
      }
    }
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Potongan kode, konfigurasi server, atau perintah CLI.',
    category: 'basic',
    keywords: ['code', 'kode', 'pre', 'snippet', 'terminal'],
    icon: Code2,
    execute: ({ editor, insertPos }) => {
      const chain = editor.chain().focus();
      if (typeof insertPos === 'number') {
        chain.insertContentAt(insertPos, '<pre><code>// Kode atau konfigurasi...</code></pre>').run();
      } else {
        chain.toggleCodeBlock().run();
      }
    }
  },
  {
    id: 'image',
    label: 'Gambar',
    description: 'Unggah atau pilih gambar dari Media Library dengan caption & AI alt text.',
    category: 'media',
    keywords: ['image', 'gambar', 'foto', 'img', 'media'],
    icon: ImageIcon,
    execute: ({ openMediaInline }) => {
      openMediaInline();
    }
  },
  {
    id: 'gallery',
    label: 'Galeri Gambar',
    description: 'Grid 2 atau 3 kolom gambar berdampingan.',
    category: 'media',
    keywords: ['gallery', 'galeri', 'grid', 'foto'],
    icon: Images,
    execute: ({ editor, insertPos }) => {
      const node = { type: 'galleryBlock', attrs: { cols: 2, images: [] } };
      if (typeof insertPos === 'number') {
        editor.chain().focus().insertContentAt(insertPos, node).run();
      } else {
        editor.chain().focus().insertContent(node).run();
      }
    }
  },
  {
    id: 'embed',
    label: 'Embed Video',
    description: 'Sematkan video YouTube, Vimeo, atau Loom secara responsif.',
    category: 'media',
    keywords: ['embed', 'video', 'youtube', 'vimeo', 'loom'],
    icon: Film,
    execute: ({ editor, insertPos }) => {
      const node = { type: 'embedBlock', attrs: { embedUrl: '' } };
      if (typeof insertPos === 'number') {
        editor.chain().focus().insertContentAt(insertPos, node).run();
      } else {
        editor.chain().focus().insertContent(node).run();
      }
    }
  },
  {
    id: 'table',
    label: 'Tabel',
    description: 'Tabel perbandingan spesifikasi, fitur, atau data.',
    category: 'advanced',
    keywords: ['table', 'tabel', 'perbandingan', 'data'],
    icon: TableIcon,
    execute: ({ editor, openTableModal, insertPos }) => {
      if (typeof insertPos === 'number') {
        editor
          .chain()
          .focus()
          .insertContentAt(insertPos, '<p></p>')
          .setTextSelection(insertPos + 1)
          .run();
      }
      openTableModal();
    }
  },
  {
    id: 'callout',
    label: 'Callout / Notice',
    description: 'Kotak sorotan ringkasan, tips praktis, atau perhatian.',
    category: 'advanced',
    keywords: ['callout', 'notice', 'box', 'sorotan', 'tips', 'info'],
    icon: Info,
    execute: ({ editor, insertPos }) => {
      const node = {
        type: 'calloutBox',
        attrs: { tone: 'info' },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Catatan Praktis 1sLabs: Tuliskan poin kunci atau ringkasan penting di sini.' }]
          }
        ]
      };
      if (typeof insertPos === 'number') {
        editor.chain().focus().insertContentAt(insertPos, node).run();
      } else {
        editor.chain().focus().insertContent(node).run();
      }
    }
  },
  {
    id: 'cta',
    label: 'Button / CTA',
    description: 'Tombol ajakan bertindak mengarah ke konsultasi atau layanan 1sLabs.',
    category: 'advanced',
    keywords: ['button', 'cta', 'tombol', 'aksi'],
    icon: MousePointerClick,
    execute: ({ editor, insertPos }) => {
      const node = {
        type: 'ctaButton',
        attrs: {
          label: 'Konsultasi Gratis dengan Tim 1sLabs',
          href: '/schedule',
          variant: 'primary',
          align: 'left',
          newTab: false
        }
      };
      if (typeof insertPos === 'number') {
        editor.chain().focus().insertContentAt(insertPos, node).run();
      } else {
        editor.chain().focus().insertContent(node).run();
      }
    }
  },
  {
    id: 'customHtml',
    label: 'Custom HTML',
    description: 'Sisipkan markup HTML khusus (disanitasi aman di server).',
    category: 'advanced',
    keywords: ['html', 'custom', 'embed-code'],
    icon: FileCode,
    execute: ({ editor, insertPos }) => {
      const node = { type: 'customHtmlBlock', attrs: { html: '<p>Konten HTML kustom...</p>' } };
      if (typeof insertPos === 'number') {
        editor.chain().focus().insertContentAt(insertPos, node).run();
      } else {
        editor.chain().focus().insertContent(node).run();
      }
    }
  },
  {
    id: 'ai_intro',
    label: 'AI: Tulis Pembuka',
    description: 'Minta Gemini menyusun paragraf pembuka yang tajam & SEO-ready.',
    category: 'ai',
    keywords: ['ai', 'intro', 'pembuka', 'gemini'],
    icon: Sparkles,
    execute: ({ runAiTask }) => runAiTask('intro')
  },
  {
    id: 'ai_headings',
    label: 'AI: Kerangka H2/H3',
    description: 'Buat saran struktur subheading H2 & H3 sesuai topik.',
    category: 'ai',
    keywords: ['ai', 'heading', 'outline', 'kerangka'],
    icon: Sparkles,
    execute: ({ runAiTask }) => runAiTask('headings')
  },
  {
    id: 'ai_conclusion',
    label: 'AI: Tulis Kesimpulan',
    description: 'Buat paragraf penutup yang padat tanpa bahasa klise.',
    category: 'ai',
    keywords: ['ai', 'conclusion', 'penutup', 'kesimpulan'],
    icon: Sparkles,
    execute: ({ runAiTask }) => runAiTask('conclusion')
  },
  {
    id: 'ai_faq',
    label: 'AI: Saran FAQ Schema',
    description: 'Hasilkan daftar Tanya-Jawab FAQPage untuk SEO & GEO.',
    category: 'ai',
    keywords: ['ai', 'faq', 'schema', 'geo'],
    icon: Sparkles,
    execute: ({ runAiTask }) => runAiTask('faq')
  }
];

