import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Search,
  Bot,
  Layers,
  Users,
  Send,
  Inbox,
  CalendarCheck,
  BarChart3,
  Settings,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Mail,
  ChevronRight
} from 'lucide-react';

import { MarketingOverviewTab } from './MarketingOverviewTab';
import { IndonesiaBusinessTab } from './IndonesiaBusinessTab';
import { InternationalBusinessTab } from './InternationalBusinessTab';
import { ContactManagementTab } from './ContactManagementTab';
import { ProspectDatabaseTab } from './ProspectDatabaseTab';
import { CompanyResearchTab } from './CompanyResearchTab';
import { AiResearchAgentTab } from './AiResearchAgentTab';
import { ScrapingSourcesTab } from './ScrapingSourcesTab';
import { ContactIntelligenceTab } from './ContactIntelligenceTab';
import { EmailCampaignsTab } from './EmailCampaignsTab';
import { EmailInboxTab } from './EmailInboxTab';
import { FollowupManagementTab } from './FollowupManagementTab';
import { MarketingAnalyticsTab } from './MarketingAnalyticsTab';
import { MarketingSettingsTab } from './MarketingSettingsTab';
import { ProspectDetailModal } from './ProspectDetailModal';
import { MarketingCompany, api } from '../../../../services/api';

export type MarketingSubtab =
  | 'overview'
  | 'indonesia'
  | 'international'
  | 'contacts'
  | 'sources'
  | 'ai-agent'
  | 'campaigns'
  | 'inbox'
  | 'settings'
  | 'prospects'
  | 'research'
  | 'followups'
  | 'analytics';

interface MarketingViewProps {
  initialSubtab?: MarketingSubtab;
  onNavigateSubtab?: (subtab: MarketingSubtab) => void;
  onNavigate?: (tab: string) => void;
}

export const MarketingView: React.FC<MarketingViewProps> = ({
  initialSubtab = 'overview',
  onNavigateSubtab
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = (searchParams.get('sub') as MarketingSubtab) || initialSubtab || 'overview';

  const [activeSubtab, setActiveSubtab] = useState<MarketingSubtab>(initialSubtab || subParam);
  const [modalCompany, setModalCompany] = useState<MarketingCompany | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{ sent: number; max: number; remaining: number }>({
    sent: 0,
    max: 100,
    remaining: 100
  });

  // Sync when initialSubtab changes from parent AdminLayout (e.g. user clicked in main AdminSidebar)
  useEffect(() => {
    if (initialSubtab && initialSubtab !== activeSubtab) {
      setActiveSubtab(initialSubtab);
    }
  }, [initialSubtab]);

  // Sync subtab with URL search params
  useEffect(() => {
    const urlSub = searchParams.get('sub') as MarketingSubtab;
    if (urlSub && urlSub !== activeSubtab) {
      setActiveSubtab(urlSub);
    }
  }, [searchParams]);

  // Fetch quota summary
  useEffect(() => {
    api.marketing.getStats().then((res) => {
      if (res && res.success && res.quota) {
        setQuotaInfo({
          sent: res.quota.sent_count,
          max: res.quota.max_limit,
          remaining: res.quota.remaining_quota
        });
      }
    }).catch(() => {});
  }, [activeSubtab]);

  const handleSelectSubtab = (sub: MarketingSubtab) => {
    setActiveSubtab(sub);
    setSearchParams(prev => {
      prev.set('tab', `marketing-${sub}`);
      return prev;
    });
    if (onNavigateSubtab) {
      onNavigateSubtab(sub);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSubtabTitle = (sub: MarketingSubtab) => {
    switch (sub) {
      case 'overview':
        return 'Overview Dashboard';
      case 'indonesia':
        return 'Indonesia Small Business & UMKM';
      case 'international':
        return 'International Small Business Directory';
      case 'contacts':
        return 'Contact Intelligence & Multi-Channel Management';
      case 'prospects':
        return 'Prospect Database';
      case 'research':
        return 'Company Research';
      case 'ai-agent':
        return 'Gemini AI Research Agent';
      case 'sources':
        return 'Scraping & Discovery Sources';
      case 'campaigns':
        return 'Email Campaigns (Safe 100/day)';
      case 'inbox':
        return 'Email Inbox & Responses';
      case 'followups':
        return 'Follow-up Management';
      case 'analytics':
        return 'Analytics & Reports';
      case 'settings':
        return 'Marketing Settings';
      default:
        return 'Marketing Intelligence';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card — Strict 1sLabs Admin Theme */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              1sLabs Small Business Intelligence & Outreach
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] font-mono font-semibold">
              v2.0 UMKM & Global
            </span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
            <span>Marketing</span>
            <span className="text-zinc-400 font-normal text-sm">/</span>
            <span className="text-emerald-700 font-semibold text-sm font-mono">
              {getSubtabTitle(activeSubtab)}
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-3xl">
            Sistem pengumpulan database UMKM, coffee shop, bisnis lokal & international small business, 2-stage contact recovery (Gemini AI), multi-channel outreach & campaign terkontrol (maks 100 email/hari).
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-600 font-medium">Safe Outreach Quota:</span>
            <span className="font-mono font-bold text-zinc-900">
              {quotaInfo.sent} / {quotaInfo.max} sent
            </span>
          </div>
        </div>
      </div>

      {/* Full-width Active Subtab View */}
      <div className="w-full">
        {activeSubtab === 'overview' && (
          <MarketingOverviewTab
            onNavigateSubtab={(sub) => handleSelectSubtab(sub as MarketingSubtab)}
            onOpenCompanyDetail={(comp) => setModalCompany(comp)}
          />
        )}

        {activeSubtab === 'indonesia' && (
          <IndonesiaBusinessTab onOpenCompanyDetail={(comp) => setModalCompany(comp)} />
        )}

        {activeSubtab === 'international' && (
          <InternationalBusinessTab onOpenCompanyDetail={(comp) => setModalCompany(comp)} />
        )}

        {activeSubtab === 'contacts' && (
          <ContactManagementTab onOpenCompanyDetail={(comp) => setModalCompany(comp)} />
        )}

        {activeSubtab === 'prospects' && <ProspectDatabaseTab />}

        {activeSubtab === 'research' && <CompanyResearchTab />}

        {activeSubtab === 'ai-agent' && <AiResearchAgentTab />}

        {activeSubtab === 'sources' && <ScrapingSourcesTab />}

        {activeSubtab === 'campaigns' && <EmailCampaignsTab />}

        {activeSubtab === 'inbox' && <EmailInboxTab />}

        {activeSubtab === 'followups' && <FollowupManagementTab />}

        {activeSubtab === 'analytics' && <MarketingAnalyticsTab />}

        {activeSubtab === 'settings' && <MarketingSettingsTab />}
      </div>

      {/* Global Prospect Detail Modal */}
      {modalCompany && (
        <ProspectDetailModal
          company={modalCompany}
          onClose={() => setModalCompany(null)}
          onUpdate={() => {
            // refresh data if needed
          }}
        />
      )}
    </div>
  );
};
