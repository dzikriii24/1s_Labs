import { OneClickOptimizeResult, blogRequest, FaqItem } from './blogApi';

export function getErrMsg(err: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

export type ApprovalMode = 'manual_approval' | 'auto_publish_qualified' | 'always_save_draft';
export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type GenerationItemStatus =
  | 'queued'
  | 'researching'
  | 'generating'
  | 'fetching_images'
  | 'auditing'
  | 'awaiting_review'
  | 'approved'
  | 'published'
  | 'saved_draft'
  | 'rejected'
  | 'failed'
  | 'cancelled';

export interface EngineHealth {
  reachable: boolean;
  ok: boolean;
  engine_url: string;
  key_configured: boolean;
  gemini_configured: boolean;
  engine?: string | null;
  version?: string | null;
  latency_ms: number;
  error?: string | null;
}

export interface AutomationSettings {
  id: number;
  approval_mode: ApprovalMode;
  engine_url: string;
  default_language: 'id' | 'en';
  default_tone: string;
  default_word_count: number;
  min_seo_score: number;
  min_readability_score: number;
  min_geo_score: number;
  min_composite_score: number;
  min_word_count: number;
  max_similarity_threshold: number;
  daily_generation_limit: number;
  max_batch_size: number;
  auto_internal_linking: number | boolean;
  auto_web_research: number | boolean;
  auto_optimize_below_threshold?: number | boolean;
  max_auto_regenerations?: number;
  selected_pillars?: string[];
  enable_auto_images?: number | boolean;
  image_primary_provider?: 'auto' | 'unsplash' | 'pexels' | 'pixabay' | 'openverse' | 'wikimedia';
  image_fallback_provider?: 'wikimedia' | 'openverse' | 'pexels' | 'unsplash' | 'pixabay' | 'none';
  enable_ai_image_fallback?: number | boolean;
  max_images_per_article?: number;
  min_inline_images?: number;
  min_image_width?: number;
  min_image_height?: number;
  preferred_image_aspect?: string;
  preferred_image_format?: 'webp' | 'jpg' | 'jpeg';
  auto_download_images?: number | boolean;
  auto_optimize_images?: number | boolean;
  auto_image_alt_caption?: number | boolean;
  require_attribution?: number | boolean;
  inline_image_placement?: 'after_h2_balanced' | 'end_fallback';
  image_quality_validation?: number | boolean;
  timezone: string;
  updated_at?: string;
}

export interface ArticleImageRecord {
  id: number;
  generation_item_id?: number | null;
  article_id?: number | null;
  role: 'featured' | 'inline' | 'backup';
  provider: string;
  provider_image_id?: string | null;
  original_url: string;
  local_url?: string | null;
  search_query?: string | null;
  title?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  photographer_name?: string | null;
  photographer_url?: string | null;
  source_page_url?: string | null;
  license_name?: string | null;
  attribution_text?: string | null;
  attribution_required: number | boolean;
  width: number;
  height: number;
  file_format?: string | null;
  file_size_bytes: number;
  placement_section?: string | null;
  placement_index: number;
  relevance_score: number;
  status: 'local' | 'external_fallback' | 'failed';
  is_selected: number | boolean;
  error_detail?: string | null;
}

export interface StockImageCandidate {
  provider: string;
  provider_image_id: string;
  original_url: string;
  thumb_url?: string | null;
  title: string;
  description?: string;
  alt?: string;
  photographer_name?: string | null;
  photographer_url?: string | null;
  source_page_url?: string | null;
  license_name?: string | null;
  attribution_text?: string | null;
  attribution_required?: boolean;
  width: number;
  height: number;
}

export interface ImageQualityReport {
  score: number;
  passed: boolean;
  has_featured: boolean;
  inline_count: number;
  local_count: number;
  external_fallback_count: number;
  issues: Array<{ severity: string; code: string; message: string }>;
}

export type ImageProviderStatusMap = Record<
  string,
  { configured: boolean; available?: boolean; authenticated?: boolean; key_required?: boolean; license?: string; role?: string }
>;

export interface AutomationOverviewResponse {
  settings: AutomationSettings;
  quota: {
    daily_used: number;
    daily_limit: number;
    remaining: number;
  };
  counts: {
    active_queue: number;
    awaiting_review: number;
    published_via_automation: number;
    saved_draft: number;
    rejected: number;
    failed: number;
    total_items: number;
    active_schedules: number;
    total_schedules: number;
    total_blog_published: number;
    total_blog_draft: number;
    pending_seo_suggestions: number;
  };
  averages: {
    seo_score: number;
    geo_score: number;
    composite_score: number;
  };
  next_scheduled_run?: {
    id: number;
    job_code: string;
    name: string;
    cron_expression: string;
    next_run_at?: string | null;
    last_run_at?: string | null;
    last_run_status?: string | null;
  } | null;
  engine_health: EngineHealth;
}

export interface KnowledgeFact {
  label: string;
  value: string;
  status?: 'verified' | 'needs_verification';
}

export type KnowledgeFactItem = KnowledgeFact | string;

export interface KnowledgeEntry {
  id: number;
  entry_key: string;
  category_number: number;
  category_label: string;
  title: string;
  verification_status: 'verified' | 'needs_verification';
  source_reference?: string | null;
  summary: string;
  facts: KnowledgeFactItem[];
  content_markdown?: string | null;
  is_active: number | boolean;
  updated_at?: string;
}

export interface ContentPillar {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  default_intent: SearchIntent;
  primary_cta_label: string;
  primary_cta_path: string;
  category_slug?: string | null;
  sample_topics: string[];
  priority_weight: number;
  published_articles?: number;
  is_active: boolean | number;
  sort_order: number;
}

export interface TopicOpportunity {
  pillar_code: string;
  title: string;
  target_keyword: string;
  secondary_keywords: string[];
  search_intent: SearchIntent;
  funnel_stage?: string;
  target_audience?: string;
  service_target?: string;
  opportunity_score: number;
  rationale: string;
  duplicate_risk: 'low' | 'medium' | 'high';
  similarity_score: number;
  matched_existing_title?: string | null;
  keyword_conflict?: { id: number; title: string } | null;
}

export interface ContentGapItem {
  code: string;
  name: string;
  category_slug?: string | null;
  priority_weight: number;
  published_count: number;
  queued_count: number;
  planned_calendar_count: number;
  gap_status: 'high_gap' | 'growing' | 'covered';
}

export interface ContentCalendarItem {
  id: number;
  scheduled_date: string;
  day_label: string;
  pillar_code: string;
  pillar_name?: string;
  primary_cta_path?: string;
  title: string;
  target_keyword: string;
  secondary_keywords: string[];
  search_intent: SearchIntent;
  target_audience?: string | null;
  priority_score: number;
  rationale?: string | null;
  status: 'planned' | 'queued' | 'generated' | 'published' | 'skipped';
  job_id?: number | null;
  item_id?: number | null;
  article_id?: number | null;
}

export interface QualityGateReport {
  passed: boolean;
  auto_optimized?: boolean;
  regeneration_attempts?: number;
  hard_failures: Array<{ code: string; message: string }>;
  score_failures: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  image_quality?: ImageQualityReport | null;
  image_gate_blocked_auto_publish?: boolean;
  thresholds_used?: Record<string, number>;
  metrics?: Record<string, string | number | boolean | null>;
  checks?: Array<{ id: string; group: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string }>;
}

export interface GenerationJob {
  id: number;
  job_uuid: string;
  job_type: 'manual' | 'batch' | 'scheduled' | 'autonomous';
  schedule_id?: number | null;
  title: string;
  pillar_code?: string | null;
  pillar_codes?: string[];
  approval_mode: ApprovalMode;
  status: 'queued' | 'running' | 'completed' | 'partial_failed' | 'failed' | 'cancelled';
  total_items: number;
  completed_items: number;
  failed_items: number;
  created_by_name?: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface GenerationItem {
  id: number;
  job_id: number;
  job_type?: string;
  approval_mode?: string;
  job_title?: string;
  topic: string;
  target_keyword: string;
  secondary_keywords?: string | null;
  pillar_code?: string | null;
  search_intent: SearchIntent;
  language: string;
  word_count_target: number;
  enable_web_research: number | boolean;
  custom_instructions?: string | null;
  status: GenerationItemStatus;
  engine_job_id?: string | null;
  draft_title?: string | null;
  draft_slug?: string | null;
  draft_excerpt?: string | null;
  draft_meta_title?: string | null;
  draft_meta_description?: string | null;
  draft_focus_keyphrase?: string | null;
  draft_secondary_keyphrases?: string | null;
  draft_content?: string | null;
  draft_faq_items?: FaqItem[];
  target_audience?: string | null;
  recommended_category?: string | null;
  featured_image_recommendation?: string | null;
  featured_image_alt?: string | null;
  draft_featured_image?: string | null;
  draft_featured_image_caption?: string | null;
  image_plan?: {
    visual_theme?: string;
    featured?: { search_query?: string; alt_text?: string; caption?: string };
    inline?: Array<{ section_heading?: string; search_query?: string; alt_text?: string; caption?: string }>;
  } | null;
  image_quality_report?: ImageQualityReport | null;
  images?: ArticleImageRecord[];
  regeneration_attempts?: number;
  seo_score: number;
  readability_score: number;
  geo_score: number;
  composite_score: number;
  similarity_score: number;
  similarity_match_title?: string | null;
  quality_passed: number | boolean;
  quality_report?: QualityGateReport | null;
  generation_trace?: {
    trace?: Array<{ stage: string; pct: number; detail: string; elapsed_s: number }>;
    warnings?: string[];
    claims_warnings?: string[];
    tags?: string[];
    elapsed_ms?: number;
  } | null;
  error_message?: string | null;
  retry_count: number;
  published_article_id?: number | null;
  published_slug?: string | null;
  blog_status?: string | null;
  review_notes?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface AutomationSchedule {
  id: number;
  job_code: string;
  name: string;
  description?: string | null;
  cron_expression: string;
  timezone: string;
  pillar_code?: string | null;
  pillar_codes?: string[];
  articles_per_run: number;
  approval_mode_override?: ApprovalMode | null;
  enable_web_research: boolean;
  is_active: boolean;
  is_locked: boolean;
  last_run_at?: string | null;
  last_run_status?: string | null;
  next_run_at?: string | null;
  next_run_preview?: string | null;
  timeout_seconds: number;
  retry_limit: number;
}

export interface AutomationScheduleRun {
  id: number;
  schedule_id: number;
  schedule_name?: string;
  job_code?: string;
  trigger_type: 'cron' | 'manual';
  status: 'running' | 'completed' | 'partial_failed' | 'failed' | 'skipped_locked';
  topics_planned: number;
  items_succeeded: number;
  items_failed: number;
  items_published: number;
  job_id?: number | null;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface DuplicateCheckResult {
  exact_slug_conflict: boolean;
  similarity_score: number;
  matched_title?: string | null;
  keyword_conflict?: { id: number; title: string } | null;
}

export const contentAutomationApi = {
  getOverview: () => blogRequest<AutomationOverviewResponse>('/content-automation/overview'),
  getEngineHealth: (engineUrl?: string) =>
    blogRequest<{ health: EngineHealth }>(
      `/content-automation/engine/health${engineUrl ? `?engine_url=${encodeURIComponent(engineUrl)}` : ''}`
    ),

  getSettings: () => blogRequest<{ settings: AutomationSettings }>('/content-automation/settings'),
  updateSettings: (payload: Partial<AutomationSettings>) =>
    blogRequest<{ settings: AutomationSettings }>('/content-automation/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Knowledge Base
  getKnowledge: () => blogRequest<{ entries: KnowledgeEntry[] }>('/content-automation/knowledge'),
  upsertKnowledge: (entryKey: string, payload: Partial<KnowledgeEntry>) =>
    blogRequest<{ entry: KnowledgeEntry }>(`/content-automation/knowledge/${encodeURIComponent(entryKey)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  syncKnowledgeBaseline: () =>
    blogRequest<{ updated: number; total_baseline: number }>('/content-automation/knowledge/sync-baseline', {
      method: 'POST'
    }),

  // Strategy & Pillars
  getPillars: () => blogRequest<{ pillars: ContentPillar[] }>('/content-automation/strategy/pillars'),
  updatePillar: (id: number, payload: Partial<ContentPillar>) =>
    blogRequest<{ pillar: ContentPillar }>(`/content-automation/strategy/pillars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  discoverTopics: (payload: {
    pillar_code?: string;
    pillar_codes?: string[];
    count?: number;
    use_ai?: boolean;
    save_to_ideas?: boolean;
  }) =>
    blogRequest<{ source: string; selected_pillars?: string[]; candidates: TopicOpportunity[] }>(
      '/content-automation/strategy/discover-topics',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    ),
  getGapAnalysis: () => blogRequest<{ gaps: ContentGapItem[] }>('/content-automation/strategy/gap-analysis'),
  getCalendar: (params?: { limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return blogRequest<{ calendar: ContentCalendarItem[] }>(`/content-automation/strategy/calendar${qs ? `?${qs}` : ''}`);
  },
  generateCalendar: (payload: {
    pillar_codes?: string[];
    days?: number;
    articles_per_day?: number;
    start_date?: string;
    replace_planned?: boolean;
    use_ai?: boolean;
  }) =>
    blogRequest<{ source: string; created_count: number; calendar: ContentCalendarItem[] }>(
      '/content-automation/strategy/calendar/generate',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    ),
  queueCalendarItem: (id: number, payload?: { approval_mode?: ApprovalMode }) =>
    blogRequest<{ calendar_item: ContentCalendarItem; job: GenerationJob; item: GenerationItem }>(
      `/content-automation/strategy/calendar/${id}/queue`,
      {
        method: 'POST',
        body: JSON.stringify(payload || {})
      }
    ),
  deleteCalendarItem: (id: number) =>
    blogRequest<{ deleted: boolean; id: number }>(`/content-automation/strategy/calendar/${id}`, {
      method: 'DELETE'
    }),
  checkDuplicate: (payload: { title: string; slug?: string; focus_keyphrase?: string; content?: string }) =>
    blogRequest<{ check: DuplicateCheckResult }>('/content-automation/strategy/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Autonomous One-Click & Generation Queue
  runAutonomous: (payload: {
    pillar_codes?: string[];
    article_count?: number;
    approval_mode?: ApprovalMode;
    language?: 'id' | 'en';
    word_count_target?: number;
    enable_web_research?: boolean;
    custom_instructions?: string;
    save_pillar_selection?: boolean;
    use_ai?: boolean;
  }) =>
    blogRequest<{ job: GenerationJob; items: GenerationItem[]; selected_pillars: string[]; discovery_source: string }>(
      '/content-automation/run-autonomous',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    ),
  generateManual: (payload: {
    topic: string;
    target_keyword?: string;
    secondary_keywords?: string;
    pillar_code?: string;
    search_intent?: SearchIntent;
    language?: 'id' | 'en';
    word_count_target?: number;
    enable_web_research?: boolean;
    custom_instructions?: string;
    approval_mode?: ApprovalMode;
  }) =>
    blogRequest<{ job: GenerationJob; item: GenerationItem }>('/content-automation/generate/manual', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  generateBatch: (payload: {
    title?: string;
    pillar_code?: string;
    search_intent?: SearchIntent;
    language?: 'id' | 'en';
    word_count_target?: number;
    enable_web_research?: boolean;
    approval_mode?: ApprovalMode;
    custom_instructions?: string;
    topics: Array<
      | string
      | {
          topic: string;
          target_keyword?: string;
          secondary_keywords?: string;
          pillar_code?: string;
          search_intent?: SearchIntent;
        }
    >;
  }) =>
    blogRequest<{ job: GenerationJob; items: GenerationItem[] }>('/content-automation/generate/batch', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  listJobs: (params?: { limit?: number; job_type?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.job_type) q.set('job_type', params.job_type);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return blogRequest<{ jobs: GenerationJob[] }>(`/content-automation/jobs${qs ? `?${qs}` : ''}`);
  },
  getJobDetails: (jobId: number) =>
    blogRequest<{ job: GenerationJob; items: GenerationItem[] }>(`/content-automation/jobs/${jobId}`),
  cancelJob: (jobId: number) =>
    blogRequest<{ job_id: number; status: string }>(`/content-automation/jobs/${jobId}/cancel`, { method: 'POST' }),

  // Review Items
  listItems: (params?: { status?: string; pillar_code?: string; job_id?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.pillar_code) q.set('pillar_code', params.pillar_code);
    if (params?.job_id) q.set('job_id', String(params.job_id));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return blogRequest<{ items: GenerationItem[] }>(`/content-automation/items${qs ? `?${qs}` : ''}`);
  },
  getItem: (itemId: number) => blogRequest<{ item: GenerationItem }>(`/content-automation/items/${itemId}`),
  updateItem: (itemId: number, payload: Partial<GenerationItem>) =>
    blogRequest<{ item: GenerationItem }>(`/content-automation/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  optimizeItemWithAi: (itemId: number) =>
    blogRequest<{ item: GenerationItem; optimization: OneClickOptimizeResult }>(`/content-automation/items/${itemId}/optimize-ai`, {
      method: 'POST'
    }),
  getImageProviders: () => blogRequest<{ providers: ImageProviderStatusMap }>('/content-automation/images/providers'),
  searchStockImages: (payload: { query: string; providers?: string[]; exclude_urls?: string[]; per_provider?: number }) =>
    blogRequest<{ query: string; count: number; candidates: StockImageCandidate[] }>('/content-automation/images/search', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  rediscoverItemImages: (itemId: number) =>
    blogRequest<{ item: GenerationItem }>(`/content-automation/items/${itemId}/images/discover`, {
      method: 'POST'
    }),
  replaceItemImage: (
    itemId: number,
    payload: {
      role: 'featured' | 'inline';
      placement_index?: number;
      placement_section?: string;
      search_query?: string;
      local_url?: string;
      candidate?: StockImageCandidate;
      image_id?: number;
      alt_text?: string;
      caption?: string;
    }
  ) =>
    blogRequest<{ item: GenerationItem }>(`/content-automation/items/${itemId}/images/replace`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  approveItem: (itemId: number, payload: { publish_mode?: 'published' | 'draft'; allow_override?: boolean; notes?: string }) =>
    blogRequest<{ item: GenerationItem; publication: { article_id: number; slug: string; status: string; action: string } }>(
      `/content-automation/items/${itemId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    ),
  rejectItem: (itemId: number, notes: string) =>
    blogRequest<{ item: GenerationItem }>(`/content-automation/items/${itemId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),
  retryItem: (itemId: number) =>
    blogRequest<{ item: GenerationItem }>(`/content-automation/items/${itemId}/retry`, { method: 'POST' }),
  regenerateItem: (itemId: number, custom_instructions = '') =>
    blogRequest<{ job: GenerationJob; item: GenerationItem }>(`/content-automation/items/${itemId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ custom_instructions })
    }),

  // Scheduler
  listSchedules: () => blogRequest<{ schedules: AutomationSchedule[] }>('/content-automation/schedules'),
  createSchedule: (payload: Partial<AutomationSchedule>) =>
    blogRequest<{ schedule: AutomationSchedule }>('/content-automation/schedules', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateSchedule: (id: number, payload: Partial<AutomationSchedule>) =>
    blogRequest<{ schedule: AutomationSchedule }>(`/content-automation/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteSchedule: (id: number) =>
    blogRequest<{ deleted: boolean }>(`/content-automation/schedules/${id}`, { method: 'DELETE' }),
  runScheduleNow: (id: number) =>
    blogRequest<{ started: boolean; schedule_id: number; message: string }>(`/content-automation/schedules/${id}/run`, {
      method: 'POST'
    }),
  listScheduleRuns: (scheduleId?: number) =>
    blogRequest<{ runs: AutomationScheduleRun[] }>(
      `/content-automation/schedule-runs${scheduleId ? `?schedule_id=${scheduleId}` : ''}`
    )
};
