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
  ChevronRight,
  Store,
  Globe,
  CheckSquare
} from 'lucide-react';

import { LeadDashboardTab } from './LeadDashboardTab';
import { LeadDiscoveryTab } from './LeadDiscoveryTab';
import { CompanyDatabaseTab } from './CompanyDatabaseTab';
import { EmailDiscoveryTab } from './EmailDiscoveryTab';
import { LeadReviewTab } from './LeadReviewTab';
import { EmailCampaignsTab } from './EmailCampaignsTab';
import { EmailInboxTab } from './EmailInboxTab';
import { MarketingSettingsTab } from './MarketingSettingsTab';

// Existing legacy / detailed views
import { IndonesiaBusinessTab } from './IndonesiaBusinessTab';
import { InternationalBusinessTab } from './InternationalBusinessTab';
import { ContactManagementTab } from './ContactManagementTab';
import { ProspectDatabaseTab } from './ProspectDatabaseTab';
import { CompanyResearchTab } from './CompanyResearchTab';
import { AiResearchAgentTab } from './AiResearchAgentTab';
import { ScrapingSourcesTab } from './ScrapingSourcesTab';
import { FollowupManagementTab } from './FollowupManagementTab';
import { MarketingAnalyticsTab } from './MarketingAnalyticsTab';
import { ProspectDetailModal } from './ProspectDetailModal';
import { MarketingCompany, api } from '../../../../services/api';

export type MarketingSubtab =
  | 'overview'
  | 'discovery'
  | 'companies'
  | 'email-discovery'
  | 'review'
  | 'campaigns'
  | 'inbox'
  | 'settings'
  | 'indonesia'
  | 'international'
  | 'contacts'
  | 'sources'
  | 'ai-agent'
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

  // Sync when initialSubtab changes from parent AdminLayout
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
        return 'Lead Dashboard';
      case 'discovery':
        return 'Lead Discovery (Sumber Data)';
      case 'companies':
        return 'Company Database';
      case 'email-discovery':
        return 'Email Discovery (DNS MX)';
      case 'review':
        return 'Lead Review Pipeline';
      case 'campaigns':
        return 'Email Campaign (Safe 100/day)';
      case 'indonesia':
        return 'Indonesia Small Business & UMKM';
      case 'international':
        return 'International Business Directory';
      case 'contacts':
        return 'Contact Intelligence';
      case 'prospects':
        return 'Prospect Database';
      case 'research':
        return 'Company Research';
      case 'ai-agent':
        return 'Gemini AI Research Agent';
      case 'sources':
        return 'Discovery Sources & Adapters';
      case 'inbox':
        return 'Email Inbox & Responses';
      case 'followups':
        return 'Follow-up Management';
      case 'analytics':
        return 'Analytics & Reports';
      case 'settings':
        return 'Marketing & API Settings';
      default:
        return 'Business Lead Acquisition';
    }
  };

  // Structured Core Navigation Tabs for Lead Acquisition
  const CORE_NAV_TABS: Array<{ id: MarketingSubtab; label: string; icon: any; badge?: string }> = [
    { id: 'overview', label: 'Lead Dashboard', icon: LayoutDashboard },
    { id: 'discovery', label: 'Lead Discovery', icon: Search, badge: 'OSM/SDI' },
    { id: 'companies', label: 'Company Database', icon: Database },
    { id: 'email-discovery', label: 'Email Discovery', icon: Mail, badge: 'DNS MX' },
    { id: 'review', label: 'Lead Review', icon: ShieldCheck },
    { id: 'campaigns', label: 'Email Campaign', icon: Send, badge: '100/day' },
    { id: 'inbox', label: 'Responses', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              1sLabs Business Lead Acquisition System
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] font-mono font-semibold">
              B2B Indonesia
            </span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
            <span>Business Lead Acquisition</span>
            <span className="text-zinc-400 font-normal text-sm">/</span>
            <span className="text-emerald-700 font-semibold text-sm font-mono">
              {getSubtabTitle(activeSubtab)}
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-3xl">
            Platform internal pengumpulan, verifikasi teknis DNS MX email bisnis, kualifikasi prospek, dan pelaksanaan outreach kampanye B2B 1sLabs ke perusahaan dan UMKM di seluruh Indonesia.
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

      {/* Modern Horizontal Navigation Pill Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-2 shadow-xs overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          {CORE_NAV_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubtab === tab.id || (tab.id === 'companies' && (activeSubtab === 'indonesia' || activeSubtab === 'prospects'));
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectSubtab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      isActive
                        ? 'bg-zinc-800 text-emerald-400'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-width Active Subtab View */}
      <div className="w-full">
        {activeSubtab === 'overview' && (
          <LeadDashboardTab
            onNavigateSubtab={(sub) => handleSelectSubtab(sub as MarketingSubtab)}
            onOpenCompanyDetail={(comp) => setModalCompany(comp)}
          />
        )}

        {activeSubtab === 'discovery' && (
          <LeadDiscoveryTab
            onNavigateSubtab={(sub) => handleSelectSubtab(sub as MarketingSubtab)}
          />
        )}

        {(activeSubtab === 'companies' || activeSubtab === 'prospects') && (
          <CompanyDatabaseTab />
        )}

        {activeSubtab === 'email-discovery' && (
          <EmailDiscoveryTab onOpenCompanyDetail={(comp) => setModalCompany(comp)} />
        )}

        {activeSubtab === 'review' && (
          <LeadReviewTab
            onNavigateSubtab={(sub) => handleSelectSubtab(sub as MarketingSubtab)}
            onOpenCompanyDetail={(comp) => setModalCompany(comp)}
          />
        )}

        {activeSubtab === 'campaigns' && <EmailCampaignsTab />}

        {activeSubtab === 'inbox' && <EmailInboxTab />}

        {activeSubtab === 'settings' && <MarketingSettingsTab />}

        {/* Legacy / Direct Routes Backward Compatibility */}
        {activeSubtab === 'indonesia' && (
          <IndonesiaBusinessTab onOpenCompanyDetail={(comp) => setModalCompany(comp)} />
        )}

        {activeSubtab === 'international' && (
          <InternationalBusinessTab onOpenCompanyDetail={(comp) => setModalCompany(comp)} />
        )}

        {activeSubtab === 'contacts' && (
          <ContactManagementTab onOpenCompanyDetail={(comp) => setModalCompany(comp)} />
        )}

        {activeSubtab === 'research' && <CompanyResearchTab />}

        {activeSubtab === 'ai-agent' && <AiResearchAgentTab />}

        {activeSubtab === 'sources' && <ScrapingSourcesTab />}

        {activeSubtab === 'followups' && <FollowupManagementTab />}

        {activeSubtab === 'analytics' && <MarketingAnalyticsTab />}
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
