import type {
  ArticlePriority,
  ArticleStatus,
  ArticleVisibility,
  FaqItem
} from '../../../../../services/blogApi';

export type AutosaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export type SidebarInspectorTab = 'post' | 'seo' | 'advanced';

export interface EditorFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  featured_image_alt: string;
  featured_image_caption: string;
  category_id: string;
  author_id: string;
  author_name: string;
  status: ArticleStatus;
  visibility: ArticleVisibility;
  priority: ArticlePriority;
  due_date: string;
  editorial_notes: string;
  is_featured: boolean;
  is_pillar: boolean;
  cluster_id: string;
  published_at: string;
  tags: string[];
  focus_keyphrase: string;
  secondary_keyphrases: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  robots_directive: string;
  og_title: string;
  og_description: string;
  og_image: string;
  schema_type: string;
  faq_items: FaqItem[];
}

export const INITIAL_FORM: EditorFormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '<p></p>',
  featured_image: '',
  featured_image_alt: '',
  featured_image_caption: '',
  category_id: '',
  author_id: '',
  author_name: 'Tim Editorial 1sLabs',
  status: 'draft',
  visibility: 'public',
  priority: 'medium',
  due_date: '',
  editorial_notes: '',
  is_featured: false,
  is_pillar: false,
  cluster_id: '',
  published_at: '',
  tags: [],
  focus_keyphrase: '',
  secondary_keyphrases: '',
  meta_title: '',
  meta_description: '',
  canonical_url: '',
  robots_directive: 'index,follow',
  og_title: '',
  og_description: '',
  og_image: '',
  schema_type: 'BlogPosting',
  faq_items: []
};

export interface SelectionRangeText {
  from: number;
  to: number;
  text: string;
}

export interface SelectedAiPreview {
  task: string;
  originalText: string;
  improvedHtml: string;
  improvedText: string;
  explanation: string;
  range: { from: number; to: number } | null;
}

export interface GalleryImageItem {
  src: string;
  alt: string;
}

export function quickSlugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 140);
}

export function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

