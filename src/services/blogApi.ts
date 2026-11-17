import { buildQueryString, clearAuthSession } from './api';

const API_BASE = '/api';

export type ArticleStatus = 'ideas' | 'draft' | 'in_review' | 'needs_revision' | 'scheduled' | 'published';
export type ArticleVisibility = 'public' | 'unlisted' | 'private';
export type ArticlePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  sort_order: number;
  article_count?: number;
  created_at?: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  article_count?: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoCheckItem {
  category: 'seo' | 'readability' | 'geo';
  id: string;
  title: string;
  status: 'good' | 'warning' | 'problem';
  priority: 'critical' | 'high' | 'medium' | 'low';
  detail: string;
  recommendation: string;
  action_type?: string | null;
}

export interface SeoAnalysisResult {
  seo_score: number;
  readability_score: number;
  geo_score: number;
  composite_score: number;
  health_status: 'good' | 'needs_improvement' | 'poor';
  metrics: {
    word_count: number;
    reading_time: number;
    sentence_count: number;
    long_sentence_ratio: number;
    paragraph_count: number;
    long_paragraph_count: number;
    h1_in_body_count: number;
    h2_count: number;
    subheading_count: number;
    max_words_without_subheading: number;
    transition_ratio: number;
    passive_ratio: number;
    title_length: number;
    title_pixel_width: number;
    meta_description_length: number;
    slug_length: number;
    keyphrase_count: number;
    keyphrase_density: number;
    internal_links_count: number;
    external_links_count: number;
    content_images_count: number;
    images_missing_alt_count: number;
    list_count: number;
    table_count: number;
    callout_count: number;
    faq_count: number;
    detected_intent: string;
    matched_entities: string[];
  };
  links: {
    internal: Array<{ href: string; text: string }>;
    external: Array<{ href: string; text: string }>;
  };
  headings: Array<{ tag: string; text: string }>;
  checks: SeoCheckItem[];
}

export interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  featured_image_caption?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  category_color?: string | null;
  author_id?: number | null;
  author_name: string;
  status: ArticleStatus;
  visibility?: ArticleVisibility;
  priority: ArticlePriority;
  due_date?: string | null;
  editorial_notes?: string | null;
  is_featured: number | boolean;
  views: number;
  reading_time: number;
  meta_title?: string | null;
  meta_description?: string | null;
  focus_keyphrase?: string | null;
  secondary_keyphrases?: string | null;
  canonical_url?: string | null;
  robots_directive?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  schema_type?: string | null;
  faq_schema_json?: string | null;
  faq_items?: FaqItem[];
  seo_score: number;
  readability_score: number;
  geo_score: number;
  seo_audit?: SeoAnalysisResult | null;
  seo_audit_at?: string | null;
  cluster_id?: number | null;
  cluster_name?: string | null;
  cluster_pillar_title?: string | null;
  cluster_pillar_slug?: string | null;
  is_pillar?: number | boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  tags?: BlogTag[];
  image_attributions?: ImageAttributionItem[];
  revision_count?: number;
}

export interface ImageAttributionItem {
  role: 'featured' | 'inline' | 'backup';
  provider: string;
  photographer_name?: string | null;
  photographer_url?: string | null;
  source_page_url?: string | null;
  license_name?: string | null;
  attribution_text?: string | null;
  attribution_required?: boolean;
}

export interface BlogStats {
  total: number;
  published_count: number;
  draft_count: number;
  scheduled_count: number;
  in_review_count: number;
  needs_revision_count: number;
  ideas_count: number;
  avg_seo_score: number;
  avg_readability_score: number;
  avg_geo_score: number;
  good_seo_count: number;
  warning_seo_count: number;
  poor_seo_count: number;
  total_views: number;
}

export interface BlogRevision {
  id: number;
  article_id: number;
  editor_id?: number | null;
  editor_name?: string | null;
  revision_type: 'manual' | 'ai_optimize' | 'autosave' | 'revert';
  title: string;
  excerpt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  focus_keyphrase?: string | null;
  seo_score: number;
  readability_score: number;
  geo_score: number;
  change_summary?: string | null;
  diff_json?: string | null;
  created_at: string;
}

export interface BlogMediaItem {
  filename: string;
  relative_path?: string;
  folder?: 'blog' | 'articles';
  url: string;
  size: number;
  modifiedAt: string;
  role?: string;
  provider?: string;
  license_name?: string;
  photographer_name?: string;
  attribution_text?: string;
  alt_text?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface BlogAuthor {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface GscSettings {
  site_url: string;
  client_id: string;
  has_client_secret: boolean;
  client_secret_masked: string;
  redirect_uri: string;
  connected: boolean;
  connected_email?: string | null;
  last_synced_at?: string | null;
}

export interface GscQueryRow {
  id: number;
  site_url: string;
  query_text: string;
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prev_clicks: number;
  prev_impressions: number;
  prev_position: number;
}

export interface GscDashboardData {
  summary: {
    total_clicks: number;
    total_impressions: number;
    avg_ctr_percent: number;
    avg_position: number;
    prev_clicks: number;
    prev_impressions: number;
    row_count: number;
    date_range_start?: string | null;
    date_range_end?: string | null;
  };
  topQueries: GscQueryRow[];
  topPages: Array<{
    page_url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  opportunities: GscQueryRow[];
  declining: GscQueryRow[];
}

export interface TopicCluster {
  id: number;
  name: string;
  pillar_title: string;
  pillar_slug?: string | null;
  target_keyword: string;
  search_intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  status: 'planned' | 'active' | 'completed';
  notes?: string | null;
  article_count?: number;
  published_count?: number;
  avg_seo_score?: number;
}

export interface ContentIdea {
  id: number;
  cluster_id?: number | null;
  cluster_name?: string | null;
  title: string;
  target_keyword?: string | null;
  search_intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  priority: 'low' | 'medium' | 'high';
  rationale?: string | null;
  suggested_outline_json?: string | null;
  source: 'manual' | 'ai_gap' | 'gsc_opportunity';
  status: 'idea' | 'planned' | 'drafted' | 'dismissed';
  linked_article_id?: number | null;
  linked_article_slug?: string | null;
  linked_article_status?: string | null;
  created_at: string;
}

export interface InternalLinkOpportunity {
  source_id: number;
  source_title: string;
  source_slug: string;
  target_id: number;
  target_title: string;
  target_url: string;
  suggested_anchor: string;
  reason: string;
}

export interface SeoRedirectRule {
  id: number;
  source_path: string;
  target_url: string;
  status_code: 301 | 302;
  hits: number;
  is_active: number | boolean;
  notes?: string | null;
  created_at: string;
}

export interface GscInspectionRecord {
  id: number;
  article_id?: number | null;
  article_title?: string | null;
  article_slug?: string | null;
  inspection_url: string;
  site_url: string;
  verdict?: string | null;
  coverage_state?: string | null;
  indexing_state?: string | null;
  robots_txt_state?: string | null;
  page_fetch_state?: string | null;
  google_canonical?: string | null;
  user_canonical?: string | null;
  last_crawl_time?: string | null;
  crawled_as?: string | null;
  inspection_result_link?: string | null;
  inspected_at: string;
}

export interface UnifiedArticlePerformance {
  id: number;
  title: string;
  slug: string;
  status: string;
  focus_keyphrase?: string | null;
  category_name?: string | null;
  views: number;
  seo_score: number;
  readability_score: number;
  geo_score: number;
  composite_score: number;
  published_at?: string | null;
  needs_optimization: boolean;
  gsc: {
    clicks: number;
    impressions: number;
    ctr_percent: number;
    position: number | null;
  };
  latest_inspection?: {
    id: number;
    verdict?: string | null;
    coverage_state?: string | null;
    last_crawl_time?: string | null;
    inspected_at?: string | null;
    inspection_result_link?: string | null;
  } | null;
}

export interface GscSummaryMetrics {
  total_clicks?: number;
  total_impressions?: number;
  avg_ctr_percent?: number;
  avg_position?: number | null;
}

export interface SuggestionTriggerMetrics {
  before_seo?: number;
  after_seo?: number;
  before_geo?: number;
  after_geo?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number | null;
}

export interface UnifiedSeoPerformanceResponse {
  gsc_summary: GscSummaryMetrics;
  top_queries: GscQueryRow[];
  opportunities: GscQueryRow[];
  declining: GscQueryRow[];
  articles: UnifiedArticlePerformance[];
}

export interface OptimizationSuggestion {
  id: number;
  article_id: number;
  current_title?: string;
  article_slug?: string;
  current_seo_score?: number;
  current_geo_score?: number;
  current_readability_score?: number;
  source: string;
  trigger_metrics?: SuggestionTriggerMetrics;
  proposed_title?: string | null;
  proposed_meta_title?: string | null;
  proposed_meta_description?: string | null;
  proposed_focus_keyphrase?: string | null;
  proposed_excerpt?: string | null;
  proposed_content?: string | null;
  proposed_faq?: FaqItem[];
  rationale?: string | null;
  status: 'pending_approval' | 'applied' | 'dismissed';
  created_at: string;
  reviewed_at?: string | null;
}

export interface OneClickOptimizeResult {
  proposed: {
    title: string;
    meta_title: string;
    meta_description: string;
    focus_keyphrase: string;
    excerpt: string;
    featured_image_alt: string;
    content: string;
    faq_items: FaqItem[];
  };
  before: {
    seo_score: number;
    readability_score: number;
    geo_score: number;
    word_count: number;
    h2_count: number;
    internal_links_count: number;
    faq_count: number;
  };
  after: {
    seo_score: number;
    readability_score: number;
    geo_score: number;
    word_count: number;
    h2_count: number;
    internal_links_count: number;
    faq_count: number;
    checks: SeoCheckItem[];
  };
  fieldDiffs: Array<{
    field: string;
    label: string;
    before: string;
    after: string;
    changed: boolean;
  }>;
  contentChanged: boolean;
  optimizationNotes: string[];
  guardWarning?: string | null;
  model: string;
  latencyMs: number;
}

export interface AiSeoAuditResult {
  audit: {
    summary: string;
    search_intent_fit: {
      detected_intent: string;
      alignment_rating: string;
      note: string;
    };
    keyword_opportunities: string[];
    readability_findings: string[];
    geo_readiness_insights: string[];
    prioritized_actions: Array<{
      priority: string;
      area: string;
      issue: string;
      fix: string;
    }>;
    faq_suggestions: FaqItem[];
  };
  deterministic: SeoAnalysisResult;
  model: string;
  latencyMs: number;
}

export async function blogRequest<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
  const token = localStorage.getItem('oneslabs_token');
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    if (retries > 0 && (!options.method || options.method === 'GET')) {
      await new Promise((r) => setTimeout(r, 900));
      return blogRequest<T>(endpoint, options, retries - 1);
    }
    throw new Error('Gagal terhubung ke server API 1sLabs.');
  }

  if ([502, 503, 504].includes(response.status) && retries > 0) {
    await new Promise((r) => setTimeout(r, 1000));
    return blogRequest<T>(endpoint, options, retries - 1);
  }

  const rawText = await response.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    if (response.status === 401) {
      clearAuthSession();
      window.location.href = '/login?expired=1';
    }
    throw new Error(`Respons server tidak valid (${response.status}).`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
      window.location.href = '/login?expired=1';
    }
    const err: any = new Error(data?.message || `Permintaan gagal (${response.status}).`);
    err.status = response.status;
    err.redirect = data?.redirect || null;
    throw err;
  }

  return data as T;
}

export const blogApi = {
  // Public
  getCategories: () => blogRequest<{ categories: BlogCategory[] }>('/blog/categories'),
  getTags: () => blogRequest<{ tags: BlogTag[] }>('/blog/tags'),
  getPosts: (params?: { category?: string; tag?: string; search?: string; featured?: string; cluster_id?: number; sort?: string; page?: number; limit?: number }) =>
    blogRequest<{ articles: BlogArticle[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/blog/posts${buildQueryString(params)}`
    ),
  getPostBySlug: (slug: string, preview = false) =>
    blogRequest<{
      article: BlogArticle;
      prevArticle: { id: number; title: string; slug: string; featured_image?: string | null; published_at?: string | null } | null;
      nextArticle: { id: number; title: string; slug: string; featured_image?: string | null; published_at?: string | null } | null;
      relatedArticles: BlogArticle[];
    }>(`/blog/posts/${encodeURIComponent(slug)}${preview ? '?preview=1' : ''}`),

  // Admin & Marketing
  getAuthors: () => blogRequest<{ authors: BlogAuthor[] }>('/blog/admin/authors'),
  getAdminPosts: (params?: {
    status?: string;
    category_id?: number | string;
    seo_health?: string;
    priority?: string;
    cluster_id?: number | string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) =>
    blogRequest<{
      articles: BlogArticle[];
      stats: BlogStats;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/blog/admin/posts${buildQueryString(params)}`),
  getAdminPost: (id: number) => blogRequest<{ article: BlogArticle }>(`/blog/admin/posts/${id}`),
  createPost: (payload: Record<string, any>, options?: { signal?: AbortSignal }) =>
    blogRequest<{ article: BlogArticle; analysis: SeoAnalysisResult }>('/blog/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...(options?.signal ? { signal: options.signal } : {})
    }),
  updatePost: (id: number, payload: Record<string, any>, options?: { signal?: AbortSignal }) =>
    blogRequest<{ article: BlogArticle; analysis: SeoAnalysisResult }>(`/blog/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      ...(options?.signal ? { signal: options.signal } : {})
    }),
  updatePostStatus: (id: number, payload: {
    status?: ArticleStatus;
    priority?: ArticlePriority;
    due_date?: string | null;
    editorial_notes?: string | null;
    published_at?: string | null;
    author_name?: string;
    author_id?: number | null;
  }) =>
    blogRequest<{ article: BlogArticle }>(`/blog/admin/posts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deletePost: (id: number) =>
    blogRequest<{ success: boolean; message: string }>(`/blog/admin/posts/${id}`, { method: 'DELETE' }),
  getRevisions: (id: number) => blogRequest<{ revisions: BlogRevision[] }>(`/blog/admin/posts/${id}/revisions`),
  revertRevision: (articleId: number, revisionId: number) =>
    blogRequest<{ article: BlogArticle; analysis: SeoAnalysisResult; message: string }>(
      `/blog/admin/posts/${articleId}/revert/${revisionId}`,
      { method: 'POST' }
    ),

  // Categories
  createCategory: (payload: Partial<BlogCategory>) =>
    blogRequest<{ category: BlogCategory }>('/blog/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: number, payload: Partial<BlogCategory>) =>
    blogRequest<{ category: BlogCategory }>(`/blog/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id: number) =>
    blogRequest<{ success: boolean }>(`/blog/admin/categories/${id}`, { method: 'DELETE' }),

  // Media Library
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return blogRequest<{ filename: string; url: string; size: number; mimetype: string }>('/blog/admin/media/upload', {
      method: 'POST',
      body: formData
    });
  },
  getMediaLibrary: () => blogRequest<{ media: BlogMediaItem[] }>('/blog/admin/media'),
  deleteMedia: (filename: string) =>
    blogRequest<{ success: boolean }>(`/blog/admin/media/${encodeURIComponent(filename)}`, { method: 'DELETE' })
};

export const seoIntelligenceApi = {
  analyzeArticle: (payload: Record<string, any>) =>
    blogRequest<{ analysis: SeoAnalysisResult }>('/seo-intelligence/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  bulkAnalyze: () =>
    blogRequest<{ analyzed_count: number; avg_seo_score: number; avg_readability_score: number; avg_geo_score: number }>(
      '/seo-intelligence/bulk-analyze',
      { method: 'POST' }
    ),
  aiAudit: (article: Record<string, any>) =>
    blogRequest<AiSeoAuditResult>('/seo-intelligence/ai/audit', {
      method: 'POST',
      body: JSON.stringify({ article })
    }),
  aiAssist: (task: string, article: Record<string, any>, extraContext = '') =>
    blogRequest<{ task: string; result: any; model: string; latencyMs: number }>('/seo-intelligence/ai/assist', {
      method: 'POST',
      body: JSON.stringify({ task, article, extraContext })
    }),
  aiOneClickOptimize: (article: Record<string, any>) =>
    blogRequest<{ optimization: OneClickOptimizeResult }>('/seo-intelligence/ai/optimize', {
      method: 'POST',
      body: JSON.stringify({ article })
    }),

  // Google Search Console
  getGscSettings: () => blogRequest<{ settings: GscSettings }>('/seo-intelligence/gsc/settings'),
  saveGscSettings: (payload: { site_url: string; client_id: string; client_secret?: string }) =>
    blogRequest<{ settings: GscSettings; message: string }>('/seo-intelligence/gsc/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  getGscAuthUrl: () => blogRequest<{ authUrl: string; redirectUri: string }>('/seo-intelligence/gsc/auth-url'),
  disconnectGsc: () => blogRequest<{ settings: GscSettings; message: string }>('/seo-intelligence/gsc/disconnect', { method: 'POST' }),
  syncGsc: () => blogRequest<{ sync: { synced_rows: number; property: string }; performance: GscDashboardData }>('/seo-intelligence/gsc/sync', { method: 'POST' }),
  getGscPerformance: () => blogRequest<{ performance: GscDashboardData }>('/seo-intelligence/gsc/performance'),
  listGscSites: () =>
    blogRequest<{
      connected: boolean;
      active_site_url: string;
      sites: Array<{ siteUrl: string; permissionLevel: string }>;
    }>('/seo-intelligence/gsc/sites'),
  inspectUrl: (payload: { article_id?: number; inspection_url?: string; site_url?: string }) =>
    blogRequest<{ inspection: GscInspectionRecord; official_note: string }>('/seo-intelligence/gsc/inspect-url', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listInspections: (articleId?: number) =>
    blogRequest<{ inspections: GscInspectionRecord[] }>(
      `/seo-intelligence/gsc/inspections${articleId ? `?article_id=${articleId}` : ''}`
    ),
  submitSitemapAndIndexNow: (site_url?: string) =>
    blogRequest<{
      gsc_sitemap: { submitted: boolean; siteUrl?: string; sitemapUrl?: string; error?: string } | null;
      indexnow: { submitted: boolean; status?: number; count?: number; error?: string } | null;
    }>('/seo-intelligence/gsc/submit-sitemap', {
      method: 'POST',
      body: JSON.stringify(site_url ? { site_url } : {})
    }),
  getUnifiedPerformance: (limit = 50) =>
    blogRequest<UnifiedSeoPerformanceResponse>(`/seo-intelligence/performance/unified?limit=${limit}`),
  listSuggestions: (status = '') =>
    blogRequest<{ suggestions: OptimizationSuggestion[] }>(
      `/seo-intelligence/suggestions${status ? `?status=${encodeURIComponent(status)}` : ''}`
    ),
  generateSuggestions: (payload: { article_id?: number; limit?: number }) =>
    blogRequest<{ generated: number; suggestions: OptimizationSuggestion[] }>('/seo-intelligence/suggestions/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  applySuggestion: (id: number) =>
    blogRequest<{ applied: boolean; article_id: number; revision_id: number }>(`/seo-intelligence/suggestions/${id}/apply`, {
      method: 'POST'
    }),
  dismissSuggestion: (id: number) =>
    blogRequest<{ dismissed: boolean; id: number }>(`/seo-intelligence/suggestions/${id}/dismiss`, {
      method: 'POST'
    }),

  // Clusters & Ideas & Internal Links
  getClusters: () => blogRequest<{ clusters: TopicCluster[] }>('/seo-intelligence/clusters'),
  createCluster: (payload: Partial<TopicCluster>) =>
    blogRequest<{ cluster: TopicCluster }>('/seo-intelligence/clusters', { method: 'POST', body: JSON.stringify(payload) }),
  updateCluster: (id: number, payload: Partial<TopicCluster>) =>
    blogRequest<{ cluster: TopicCluster }>(`/seo-intelligence/clusters/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCluster: (id: number) =>
    blogRequest<{ success: boolean }>(`/seo-intelligence/clusters/${id}`, { method: 'DELETE' }),

  getIdeas: () => blogRequest<{ ideas: ContentIdea[] }>('/seo-intelligence/ideas'),
  createIdea: (payload: Partial<ContentIdea> & { suggested_outline?: string[] }) =>
    blogRequest<{ idea: ContentIdea }>('/seo-intelligence/ideas', { method: 'POST', body: JSON.stringify(payload) }),
  updateIdea: (id: number, payload: Partial<ContentIdea>) =>
    blogRequest<{ idea: ContentIdea }>(`/seo-intelligence/ideas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteIdea: (id: number) =>
    blogRequest<{ success: boolean }>(`/seo-intelligence/ideas/${id}`, { method: 'DELETE' }),
  generateAiIdeas: (focus_topic = '') =>
    blogRequest<{ generated: ContentIdea[]; model: string }>('/seo-intelligence/ideas/generate-ai', {
      method: 'POST',
      body: JSON.stringify({ focus_topic })
    }),
  convertIdeaToDraft: (id: number, status: 'draft' | 'ideas' = 'draft') =>
    blogRequest<{ article: BlogArticle; alreadyLinked?: boolean }>(`/seo-intelligence/ideas/${id}/convert-to-draft`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),

  getInternalLinkOpportunities: () =>
    blogRequest<{ opportunities: InternalLinkOpportunity[] }>('/seo-intelligence/internal-link-opportunities'),

  // Technical Redirects
  getRedirects: () => blogRequest<{ redirects: SeoRedirectRule[] }>('/seo-intelligence/redirects'),
  createRedirect: (payload: { source_path: string; target_url: string; status_code?: number; is_active?: boolean; notes?: string }) =>
    blogRequest<{ redirect: SeoRedirectRule }>('/seo-intelligence/redirects', { method: 'POST', body: JSON.stringify(payload) }),
  updateRedirect: (id: number, payload: Partial<SeoRedirectRule>) =>
    blogRequest<{ redirect: SeoRedirectRule }>(`/seo-intelligence/redirects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRedirect: (id: number) =>
    blogRequest<{ success: boolean }>(`/seo-intelligence/redirects/${id}`, { method: 'DELETE' })
};

