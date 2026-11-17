import React, { useEffect, useState } from 'react';
import {
  BookMarked,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import {
  AutomationOverviewResponse,
  ContentPillar,
  GenerationJob,
  SearchIntent,
  contentAutomationApi
} from '../../../../services/contentAutomationApi';
import { AutomationOverviewPanel } from './AutomationOverviewPanel';
import { AutomationGeneratorPanels } from './AutomationGeneratorPanels';
import { AutomationReviewPanel } from './AutomationReviewPanel';
import { AutomationSchedulerPanel } from './AutomationSchedulerPanel';
import { AutomationStrategyPanel } from './AutomationStrategyPanel';
import { AutomationPublishedPanel } from './AutomationPublishedPanel';
import { AutomationSeoGscPanel } from './AutomationSeoGscPanel';
import { AutomationKnowledgePanel } from './AutomationKnowledgePanel';
import { AutomationSettingsPanel } from './AutomationSettingsPanel';

export type AutomationSubtabKey =
  | 'overview'
  | 'generate'
  | 'batch'
  | 'review'
  | 'scheduler'
  | 'strategy'
  | 'published'
  | 'seo'
  | 'knowledge'
  | 'settings';

interface AutomationHubViewProps {
  initialSubtab?: AutomationSubtabKey;
  onNavigateSubtab: (sub: AutomationSubtabKey) => void;
  onOpenBlogEditor: (articleId: number | null) => void;
}

const SUBTABS: Array<{ key: AutomationSubtabKey; label: string; icon: LucideIcon }> = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'generate', label: 'Automation Center', icon: Sparkles },
  { key: 'batch', label: 'Generation Queue', icon: Layers },
  { key: 'review', label: 'Content Review', icon: FileCheck2 },
  { key: 'scheduler', label: 'Automation Scheduler', icon: Clock },
  { key: 'strategy', label: 'Content Strategy', icon: Compass },
  { key: 'published', label: 'Published Articles', icon: FileText },
  { key: 'seo', label: 'SEO Performance', icon: TrendingUp },
  { key: 'knowledge', label: 'Knowledge Base', icon: BookMarked },
  { key: 'settings', label: 'Automation Settings', icon: Settings }
];

export const AutomationHubView: React.FC<AutomationHubViewProps> = ({
  initialSubtab = 'overview',
  onNavigateSubtab,
  onOpenBlogEditor
}) => {
  const [activeSubtab, setActiveSubtab] = useState<AutomationSubtabKey>(initialSubtab);
  const [overview, setOverview] = useState<AutomationOverviewResponse | null>(null);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [recentJobs, setRecentJobs] = useState<GenerationJob[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [reviewItemId, setReviewItemId] = useState<number | null>(null);
  const [prefillTopic, setPrefillTopic] = useState<{
    topic: string;
    target_keyword?: string;
    pillar_code?: string;
    search_intent?: SearchIntent;
  } | null>(null);
  const [inspectTarget, setInspectTarget] = useState<{ articleId?: number; url: string } | null>(null);

  useEffect(() => {
    setActiveSubtab(initialSubtab);
  }, [initialSubtab]);

  const loadCoreData = async () => {
    setLoadingOverview(true);
    try {
      const [ov, pil, jbs] = await Promise.all([
        contentAutomationApi.getOverview(),
        contentAutomationApi.getPillars(),
        contentAutomationApi.listJobs({ limit: 10 })
      ]);
      setOverview(ov);
      setPillars(pil.pillars || []);
      setRecentJobs(jbs.jobs || []);
    } catch {
      // handled per-panel or via banner
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadCoreData();
  }, []);

  const switchSubtab = (sub: AutomationSubtabKey) => {
    setActiveSubtab(sub);
    onNavigateSubtab(sub);
  };

  return (
    <div className="space-y-5">
      {/* Top 10-Menu Horizontal Strip (mirrors Sidebar & wraps cleanly without horizontal scrollbar) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1">
          {SUBTABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeSubtab === t.key;
            const awaitingBadge = t.key === 'review' ? overview?.counts?.awaiting_review || 0 : 0;
            return (
              <button
                key={t.key}
                onClick={() => switchSubtab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-blue-50/70 hover:text-blue-700 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                {awaitingBadge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {awaitingBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Subtab Content */}
      {activeSubtab === 'overview' && (
        <AutomationOverviewPanel
          overview={overview}
          recentJobs={recentJobs}
          loading={loadingOverview}
          onRefresh={loadCoreData}
          onNavigateSubtab={(sub) => switchSubtab(sub as AutomationSubtabKey)}
        />
      )}

      {(activeSubtab === 'generate' || activeSubtab === 'batch') && (
        <AutomationGeneratorPanels
          mode={activeSubtab === 'batch' ? 'batch' : 'single'}
          pillars={pillars}
          defaultApprovalMode={overview?.settings?.approval_mode || 'manual_approval'}
          defaultWordCount={overview?.settings?.default_word_count || 1050}
          savedSelectedPillars={overview?.settings?.selected_pillars || []}
          maxBatchSize={overview?.settings?.max_batch_size || 10}
          remainingQuota={overview?.quota?.remaining ?? 20}
          onSaveDefaultPillars={async (codes) => {
            await contentAutomationApi.updateSettings({ selected_pillars: codes });
            await loadCoreData();
          }}
          prefillTopic={prefillTopic}
          onJobCreated={loadCoreData}
          onOpenReview={(itemId) => {
            setReviewItemId(itemId || null);
            switchSubtab('review');
          }}
        />
      )}

      {activeSubtab === 'review' && (
        <AutomationReviewPanel
          initialItemId={reviewItemId}
          onRefreshOverview={loadCoreData}
          onOpenBlogEditor={(articleId) => onOpenBlogEditor(articleId)}
        />
      )}

      {activeSubtab === 'scheduler' && (
        <AutomationSchedulerPanel pillars={pillars} onRefreshOverview={loadCoreData} />
      )}

      {activeSubtab === 'strategy' && (
        <AutomationStrategyPanel
          pillars={pillars}
          onRefreshPillars={loadCoreData}
          onUseTopicInGenerator={(t) => {
            setPrefillTopic(t);
            switchSubtab('generate');
          }}
        />
      )}

      {activeSubtab === 'published' && (
        <AutomationPublishedPanel
          onOpenBlogEditor={(articleId) => onOpenBlogEditor(articleId)}
          onInspectArticleUrl={(articleId, url) => {
            setInspectTarget({ articleId, url });
            switchSubtab('seo');
          }}
        />
      )}

      {activeSubtab === 'seo' && (
        <AutomationSeoGscPanel
          initialInspectTarget={inspectTarget}
          onOpenBlogEditor={(articleId) => onOpenBlogEditor(articleId)}
        />
      )}

      {activeSubtab === 'knowledge' && <AutomationKnowledgePanel />}

      {activeSubtab === 'settings' && (
        <AutomationSettingsPanel
          settings={overview?.settings || null}
          onUpdated={() => loadCoreData()}
        />
      )}
    </div>
  );
};
